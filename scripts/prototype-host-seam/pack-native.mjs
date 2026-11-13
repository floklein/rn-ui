// PROTOTYPE (issue #14). Packs `@ui-sdk/core` with a second build for the
// native host, and the native adapter, into tarballs an app outside the
// workspace can install. Nothing in the repo changes: it works in a staging
// folder.
//
//   pnpm --filter @ui-sdk/core build
//   node scripts/prototype-host-seam/pack-native.mjs <out-dir>
//
// The second build is `dist/native`: the same modules, with each
// `x.native.js` twin in the place of `x.js`, so the twins are resolved at
// build time. Every published entry gains a `react-native` condition that
// points into it.
import { execFileSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { transpile } from "../build/transpile.mjs"

const root = path.resolve(import.meta.dirname, "../..")
const outDir = path.resolve(process.argv[2] ?? "packed")
const stageDir = path.join(outDir, "stage")
rmSync(stageDir, { recursive: true, force: true })
mkdirSync(stageDir, { recursive: true })

const readManifest = (dir) =>
  JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"))

function published(manifest) {
  const { publishConfig, devDependencies: _, scripts: __, ...rest } = manifest
  return { ...rest, ...publishConfig, private: undefined }
}

function pack(dir) {
  const { name, version } = readManifest(dir)
  execFileSync("npm", ["pack", "--pack-destination", outDir], {
    cwd: dir,
    stdio: "ignore",
  })
  return path.join(
    outDir,
    `${name.replace("@", "").replace("/", "-")}-${version}.tgz`
  )
}

// A string target under `dist` gets its counterpart in `dist/native`.
const nativeOf = (file) => file.replace(/^\.\/dist\//, "./dist/native/")

function withNativeCondition(target) {
  if (typeof target === "string") {
    return target.endsWith(".js")
      ? { "react-native": nativeOf(target), default: target }
      : target
  }
  if (!String(target.default).endsWith(".js")) {
    return target
  }
  const { types, ...others } = target
  return {
    ...(types && { types }),
    "react-native": nativeOf(target.default),
    ...others,
  }
}

// `#dev` and `#name-check` nest `development` and `default`, so the native
// condition wraps the whole pair.
function nativeImports(target) {
  const inNative = (value) =>
    typeof value === "string"
      ? value.endsWith(".js")
        ? nativeOf(value)
        : value
      : Object.fromEntries(
          Object.entries(value).map(([key, inner]) => [key, inNative(inner)])
        )
  return { "react-native": inNative(target), ...target }
}

function packCore() {
  const coreDir = path.join(root, "packages/core")
  const stage = path.join(stageDir, "core")
  if (!existsSync(path.join(coreDir, "dist/index.js"))) {
    throw new Error("Build core first: pnpm --filter @ui-sdk/core build")
  }
  cpSync(path.join(coreDir, "dist"), path.join(stage, "dist"), {
    recursive: true,
  })
  const dist = path.join(stage, "dist")
  const native = path.join(dist, "native")
  const modules = readdirSync(dist, { recursive: true }).filter((file) =>
    file.endsWith(".js")
  )
  const twins = []
  for (const file of modules) {
    mkdirSync(path.dirname(path.join(native, file)), { recursive: true })
    cpSync(path.join(dist, file), path.join(native, file))
  }
  for (const file of modules.filter((file) => file.endsWith(".native.js"))) {
    const mirrored = file.replace(/\.native\.js$/, ".js")
    renameSync(path.join(native, file), path.join(native, mirrored))
    twins.push(mirrored)
  }
  const manifest = published(readManifest(coreDir))
  manifest.exports = Object.fromEntries(
    Object.entries(manifest.exports).map(([key, target]) => [
      key,
      withNativeCondition(target),
    ])
  )
  manifest.imports = Object.fromEntries(
    Object.entries(manifest.imports).map(([key, target]) => [
      key,
      nativeImports(target),
    ])
  )
  writeFileSync(
    path.join(stage, "package.json"),
    JSON.stringify(manifest, null, 2)
  )
  return { tarball: pack(stage), twins, version: manifest.version }
}

async function packAdapter(coreVersion) {
  const adapterDir = path.join(root, "packages/react-native")
  const stage = path.join(stageDir, "react-native")
  await transpile({
    sourceDir: path.join(adapterDir, "src"),
    outDir: path.join(stage, "dist"),
  })
  const manifest = published(readManifest(adapterDir))
  manifest.peerDependencies["@ui-sdk/core"] = coreVersion
  writeFileSync(
    path.join(stage, "package.json"),
    JSON.stringify(manifest, null, 2)
  )
  return pack(stage)
}

const core = packCore()
const adapter = await packAdapter(core.version)
console.log(
  JSON.stringify({ core: core.tarball, adapter, twins: core.twins }, null, 2)
)
