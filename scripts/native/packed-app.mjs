// Runs the playground as an app outside the workspace on the packed packages:
// `node scripts/native/packed-app.mjs <dir>`. `CI=1 npx expo start` in
// `<dir>/app` then runs it on a simulator.
import { execFileSync, spawnSync } from "node:child_process"
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "../..")
const playground = path.join(root, "apps/native-playground")
const dir = path.resolve(process.argv[2] ?? "packed-app")
const app = path.join(dir, "app")
const run = (command, args) =>
  execFileSync(command, args, { cwd: app, stdio: "inherit" })
const rename = (text) =>
  text.replace(/@ui-sdk\/(core|react-native|react)\b/g, "@rn-ui-sdk/$1")

rmSync(dir, { recursive: true, force: true })
mkdirSync(app, { recursive: true })
const tarballs = execFileSync(
  process.execPath,
  [path.join(import.meta.dirname, "pack.mjs"), path.join(dir, "packs")],
  { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
)
  .trim()
  .split("\n")

for (const file of ["App.tsx", "index.ts", "screens.ts", "app.json"]) {
  const text = readFileSync(path.join(playground, file), "utf8")
  writeFileSync(
    path.join(app, file),
    rename(text).replace("../../examples/components", "./examples/components")
  )
}
const examples = path.join(root, "examples/components")
for (const file of readdirSync(examples, { recursive: true })) {
  if (/^[\w-]+\/react-native\/[\w-]+\.tsx$/.test(file)) {
    const target = path.join(app, "examples/components", file)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(
      target,
      rename(readFileSync(path.join(examples, file), "utf8"))
    )
  }
}

const { dependencies, devDependencies } = JSON.parse(
  readFileSync(path.join(playground, "package.json"), "utf8")
)
const packed = Object.fromEntries(
  tarballs.map((tarball) => [
    JSON.parse(
      execFileSync("tar", ["-xOzf", tarball, "package/package.json"], {
        encoding: "utf8",
      })
    ).name,
    `file:${tarball}`,
  ])
)
writeFileSync(
  path.join(app, "package.json"),
  JSON.stringify(
    {
      name: "packed-playground",
      private: true,
      main: "index.ts",
      dependencies: {
        ...packed,
        expo: dependencies.expo,
        react: dependencies.react,
        "react-dom": dependencies.react,
        "react-native": dependencies["react-native"],
      },
      devDependencies,
    },
    null,
    2
  )
)
writeFileSync(
  path.join(app, "tsconfig.json"),
  JSON.stringify(
    {
      extends: "expo/tsconfig.base",
      compilerOptions: { strict: true, types: ["expo/types"] },
      include: ["**/*.ts", "**/*.tsx"],
    },
    null,
    2
  )
)

run("npm", ["install", "--no-audit", "--no-fund"])
run("npx", ["tsc", "--noEmit"])
// React Native's globals clash with the DOM lib core's types need, so only
// errors in the packed declarations count when libraries are checked.
const { stdout } = spawnSync(
  "npx",
  ["tsc", "--noEmit", "--skipLibCheck", "false", "--pretty", "false"],
  { cwd: app, encoding: "utf8" }
)
const declarationErrors = stdout
  .split("\n")
  .filter((line) => line.startsWith("node_modules/@rn-ui-sdk/"))
if (declarationErrors.length) {
  console.error(declarationErrors.join("\n"))
  process.exit(1)
}
const strays = []
for (const platform of ["ios", "android"]) {
  const out = path.join(dir, `export-${platform}`)
  run("npx", [
    "expo",
    "export",
    "--platform",
    platform,
    "--source-maps",
    "--output-dir",
    out,
  ])
  const bundles = path.join(out, "_expo/static/js", platform)
  const map = readdirSync(bundles).find((file) => file.endsWith(".map"))
  const { sources } = JSON.parse(readFileSync(path.join(bundles, map), "utf8"))
  const core = sources.filter((source) => source.includes("@rn-ui-sdk/core/"))
  strays.push(
    ...sources
      .filter(
        (source) =>
          source.includes("@ui-sdk/") ||
          (source.includes("@rn-ui-sdk/core/") &&
            !source.includes("@rn-ui-sdk/core/dist/native/"))
      )
      .map((source) => `${platform}: ${source}`)
  )
  console.log(`${platform}: ${core.length} core modules, all in dist/native`)
}
if (strays.length) {
  console.error(
    `Modules from outside the native build:\n  ${strays.join("\n  ")}`
  )
  process.exitCode = 1
}
