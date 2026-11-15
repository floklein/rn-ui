// Plans and runs the device specs in tests/native through Appium. A
// component's specs run when its native entry, anything that entry imports, its
// example, fixture or spec changes. Usage is in tests/README.md.
import { execFileSync, spawn, spawnSync } from "node:child_process"
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs"
import { createServer } from "node:net"
import path from "node:path"
import { parseArgs } from "node:util"

const root = path.resolve(import.meta.dirname, "..")
const specFolder = "tests/native"
const playground = "apps/native-playground"

const tools = JSON.parse(
  readFileSync(path.join(root, specFolder, "appium.json"), "utf8")
)

// Changes here can move any device spec.
const sharedFiles = [
  "pnpm-lock.yaml",
  "packages/core/package.json",
  "packages/react-native/package.json",
  "scripts/device-specs.mjs",
  ".github/workflows/ci.yml",
]

function specFiles(base = root) {
  return readdirSync(path.join(base, specFolder))
    .filter((file) => file.endsWith(".spec.ts"))
    .sort()
}

/** Components with device specs, longest first, so `menubar` wins over `menu`. */
function specComponents(base = root) {
  return [...new Set(specFiles(base).map((file) => file.split(".")[0]))].sort(
    (a, b) => b.length - a.length
  )
}

function componentOf(name, components) {
  return components.find(
    (component) => name === component || name.startsWith(`${component}-`)
  )
}

const sourceFile = (file) =>
  /^packages\/(core|react-native)\/src\/.*\.tsx?$/.test(file)

// The native import graph, reversed: file → files importing it. A `.native.ts`
// twin and its DOM module both count, since Metro picks one per platform.
function importers(base) {
  const files = ["packages/core/src", "packages/react-native/src"].flatMap(
    (folder) =>
      readdirSync(path.join(base, folder), { recursive: true })
        .map((file) => path.join(folder, file))
        .filter(sourceFile)
  )
  const coreExports = JSON.parse(
    readFileSync(path.join(base, "packages/core/package.json"), "utf8")
  ).exports
  const graph = new Map()
  for (const file of files) {
    const text = readFileSync(path.join(base, file), "utf8").replace(
      /^\s*(?:import|export) type [^;]*?from\s*"[^"]+"/gm,
      ""
    )
    for (const [, specifier] of text.matchAll(
      /(?:from|import)\s*\(?\s*"([^"]+)"/g
    )) {
      for (const target of resolve(base, file, specifier, coreExports)) {
        if (!graph.has(target)) {
          graph.set(target, new Set())
        }
        graph.get(target).add(file)
      }
    }
  }
  return graph
}

function resolve(base, file, specifier, coreExports) {
  let stem
  if (specifier.startsWith(".")) {
    stem = path.join(path.dirname(file), specifier).replace(/\.js$/, "")
  } else if (specifier.startsWith("@ui-sdk/core")) {
    const key = `.${specifier.slice("@ui-sdk/core".length)}`
    const target =
      coreExports[key] ??
      (key.startsWith("./internal/") &&
        `./src/${key.slice("./internal/".length)}.ts`)
    if (!target) {
      return []
    }
    stem = path.join("packages/core", target).replace(/\.tsx?$/, "")
  } else {
    return []
  }
  return [
    `${stem}.ts`,
    `${stem}.tsx`,
    `${stem}.native.ts`,
    path.join(stem, "index.ts"),
  ].filter(
    (candidate) =>
      existsSync(path.join(base, candidate)) &&
      statSync(path.join(base, candidate)).isFile()
  )
}

/** The native entries that import `file`, directly or through other modules, as component names. */
function reachingEntries(file, graph) {
  const seen = new Set([file])
  const queue = [file]
  while (queue.length > 0) {
    for (const importer of graph.get(queue.pop()) ?? []) {
      if (!seen.has(importer)) {
        seen.add(importer)
        queue.push(importer)
      }
    }
  }
  return [...seen]
    .filter((seenFile) =>
      /^packages\/react-native\/src\/[\w-]+\.tsx$/.test(seenFile)
    )
    .map((entry) => path.basename(entry, ".tsx"))
}

/**
 * The components whose device specs `files` can affect, and the files that
 * run every spec.
 */
function plan(files, base = root) {
  const components = specComponents(base)
  const touched = new Set()
  const shared = []
  let graph
  for (const file of files) {
    const parts = file.split("/")
    if (file.startsWith(`${specFolder}/`)) {
      const component = file.endsWith(".spec.ts")
        ? componentOf(parts[2].split(".")[0], components)
        : undefined
      if (component) {
        touched.add(component)
      } else {
        shared.push(file)
      }
    } else if (file.startsWith(`${playground}/fixtures/`)) {
      const component = componentOf(path.basename(file, ".tsx"), components)
      if (component) {
        touched.add(component)
      }
    } else if (file.startsWith(`${playground}/test/`)) {
      continue
    } else if (
      file.startsWith(`${playground}/`) ||
      sharedFiles.includes(file)
    ) {
      shared.push(file)
    } else if (
      parts[0] === "examples" &&
      parts[1] === "components" &&
      parts[3] === "react-native"
    ) {
      const component = componentOf(parts[2], components)
      if (component) {
        touched.add(component)
      }
    } else if (sourceFile(file)) {
      graph ??= importers(base)
      for (const entry of reachingEntries(file, graph)) {
        const component = componentOf(entry, components)
        if (component) {
          touched.add(component)
        }
      }
    }
  }
  return {
    components:
      shared.length > 0 ? [...components].sort() : [...touched].sort(),
    shared,
  }
}

function specsOf(components, base = root) {
  const all = specComponents(base)
  return specFiles(base)
    .filter((file) => components.includes(componentOf(file.split(".")[0], all)))
    .map((file) => `${specFolder}/${file}`)
}

function changedFiles(baseRef) {
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" })
      .split("\n")
      .filter(Boolean)
  const base = git("merge-base", baseRef, "HEAD")[0]
  return [
    ...new Set([
      ...git("diff", "--name-only", base),
      ...git("ls-files", "--others", "--exclude-standard"),
    ]),
  ]
}

function freePort() {
  return new Promise((done) => {
    const server = createServer().listen(0, () => {
      const { port } = server.address()
      server.close(() => done(String(port)))
    })
  })
}

const appPaths = {
  ios: `${playground}/.native-build/ios/NativePlayground.app`,
  android: `${playground}/.native-build/android/app.apk`,
}

function run(command, args, options = {}) {
  const { status } = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    ...options,
  })
  if (status !== 0) {
    console.error(`${command} ${args.join(" ")} exited with ${status}.`)
    process.exit(1)
  }
}

function appium(args, options) {
  const bin = process.env.APPIUM_BIN
  return bin
    ? [bin, args, options]
    : ["npx", ["--yes", `appium@${tools.appium}`, ...args], options]
}

async function startAppium(platform, port) {
  const driver = tools.drivers[platform]
  const installed = spawnSync(
    ...appium(["driver", "list", "--installed", "--json"], {
      cwd: root,
      encoding: "utf8",
    })
  )
  if (!JSON.parse(installed.stdout || "{}")[driver.name]) {
    run(...appium(["driver", "install", "--source=npm", driver.package]))
  }
  const log = path.join(root, "tests/test-results/native/appium.log")
  mkdirSync(path.dirname(log), { recursive: true })
  const [command, args] = appium(["--port", port, "--log", log])
  const server = spawn(command, args, {
    cwd: root,
    stdio: "ignore",
    detached: true,
  })
  const stop = () => process.kill(-server.pid)
  for (let i = 0; i < 600; i++) {
    const up = await fetch(`http://127.0.0.1:${port}/status`).then(
      (response) => response.ok,
      () => false
    )
    if (up) {
      return { stop }
    }
    await new Promise((done) => setTimeout(done, 100))
  }
  stop()
  console.error(`Appium never answered on port ${port}. Its log: ${log}`)
  process.exit(1)
}

async function main() {
  const { values: flags } = parseArgs({
    options: {
      base: { type: "string", default: "origin/main" },
      all: { type: "boolean", default: false },
      dry: { type: "boolean", default: false },
      platform: { type: "string", default: process.env.DEVICE_PLATFORM },
    },
  })
  let components = specComponents().sort()
  if (!flags.all) {
    const changes = plan(changedFiles(flags.base))
    components = changes.components
    if (changes.shared.length > 0) {
      console.log(
        `Shared files changed, so every device spec runs:\n  ${changes.shared.join("\n  ")}`
      )
    }
  }
  const specs = specsOf(components)
  console.log(`Device specs: ${specs.join(" ") || "none"}`)
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `specs=${specs.join(" ")}\n`)
  }
  if (flags.dry || specs.length === 0) {
    return
  }
  const platform = flags.platform
  if (platform !== "ios" && platform !== "android") {
    console.error("Pass --platform ios or --platform android.")
    process.exit(1)
  }
  if (platform === "ios" && !process.env.SIMULATOR_UDID) {
    console.error("Set SIMULATOR_UDID to the booted simulator to run on.")
    process.exit(1)
  }
  const app = process.env.APP_PATH ?? path.join(root, appPaths[platform])
  if (!existsSync(app)) {
    run(path.join(root, playground, "scripts/build-app.sh"), [platform])
  }
  const port = process.env.APPIUM_PORT ?? (await freePort())
  const server = await startAppium(platform, port)
  // One file at a time, since every file opens a session on the one device.
  const { status } = spawnSync(
    "node",
    ["--test", "--test-concurrency=1", ...specs],
    {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        DEVICE_PLATFORM: platform,
        APP_PATH: app,
        APPIUM_PORT: port,
      },
    }
  )
  server.stop()
  process.exit(status === 0 ? 0 : 1)
}

if (import.meta.main) {
  await main()
}

export { plan, specsOf }
