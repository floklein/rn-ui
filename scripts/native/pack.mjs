// Packs core and the React and native adapters under `@rn-ui-sdk`, at the
// version in `version.json`, building each and staging copies so the repo is
// left as it was: `node scripts/native/pack.mjs <out-dir>`.
import { execFileSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "../..")
const packages = ["core", "react", "react-native"]
const publishedNames = /@ui-sdk\/(core|react-native|react)\b/g
const rewrittenFiles = /\.(js|d\.ts|map|md|txt)$/

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"))

function publishedManifest(manifest, version) {
  const {
    publishConfig: _publishConfig,
    scripts: _scripts,
    devDependencies: _devDependencies,
    private: _private,
    ...published
  } = { ...manifest, ...manifest.publishConfig }
  published.name = rename(manifest.name)
  published.version = version
  for (const field of [
    "dependencies",
    "peerDependencies",
    "peerDependenciesMeta",
  ]) {
    if (published[field]) {
      published[field] = Object.fromEntries(
        Object.entries(published[field]).map(([name, range]) => [
          rename(name),
          String(range).startsWith("workspace:") ? `^${version}` : range,
        ])
      )
    }
  }
  return published
}

const rename = (name) => name.replace(publishedNames, "@rn-ui-sdk/$1")

function stage(name, version, stageDir) {
  const packageDir = path.join(root, "packages", name)
  const manifest = readJson(path.join(packageDir, "package.json"))
  const into = path.join(stageDir, name)
  for (const entry of manifest.files) {
    if (existsSync(path.join(packageDir, entry))) {
      cpSync(path.join(packageDir, entry), path.join(into, entry), {
        recursive: true,
      })
    }
  }
  cpSync(path.join(root, "LICENSE"), path.join(into, "LICENSE"))
  for (const file of readdirSync(into, { recursive: true })) {
    if (rewrittenFiles.test(file)) {
      const text = readFileSync(path.join(into, file), "utf8")
      writeFileSync(path.join(into, file), rename(text))
    }
  }
  writeFileSync(
    path.join(into, "package.json"),
    `${JSON.stringify(publishedManifest(manifest, version), null, 2)}\n`
  )
  return into
}

const outDir = path.resolve(process.argv[2] ?? "packed")
const stageDir = path.join(outDir, "stage")
const { version } = readJson(path.join(import.meta.dirname, "version.json"))
rmSync(stageDir, { recursive: true, force: true })
mkdirSync(stageDir, { recursive: true })
for (const name of packages) {
  execFileSync("pnpm", ["build"], {
    cwd: path.join(root, "packages", name),
    stdio: ["ignore", "ignore", "inherit"],
  })
}
execFileSync(process.execPath, ["scripts/package-docs.mjs", ...packages], {
  cwd: root,
  stdio: ["ignore", "ignore", "inherit"],
})
const tarballs = packages.map((name) => {
  const file = execFileSync(
    "npm",
    ["pack", "--ignore-scripts", "--pack-destination", outDir],
    { cwd: stage(name, version, stageDir), encoding: "utf8" }
  )
  return path.join(outDir, file.trim().split("\n").at(-1))
})
rmSync(stageDir, { recursive: true, force: true })
console.log(tarballs.join("\n"))
