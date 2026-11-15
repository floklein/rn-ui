import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { after, before, test } from "node:test"
import { build } from "esbuild"

const root = path.resolve(import.meta.dirname, "../../..")
const { version } = JSON.parse(
  readFileSync(path.join(root, "scripts/native/version.json"), "utf8")
)
const status = () =>
  execFileSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  })

const outDir = mkdtempSync(path.join(tmpdir(), "rn-ui-sdk-pack-"))
const unpacked = path.join(outDir, "unpacked")
let statusBefore
let result
let tarballs

before(() => {
  statusBefore = status()
  result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/native/pack.mjs"), outDir],
    { cwd: root, encoding: "utf8" }
  )
  tarballs = readdirSync(outDir).filter((file) => file.endsWith(".tgz"))
  for (const tarball of tarballs) {
    const into = path.join(unpacked, tarball)
    execFileSync("mkdir", ["-p", into])
    execFileSync("tar", ["-xzf", path.join(outDir, tarball), "-C", into])
  }
})
after(() => {
  rmSync(outDir, { recursive: true, force: true })
})

const manifests = () =>
  tarballs.map((tarball) =>
    JSON.parse(
      readFileSync(path.join(unpacked, tarball, "package/package.json"), "utf8")
    )
  )

test("the pack step exits 0", () => {
  assert.equal(result.status, 0, result.stderr)
})

test("it packs core, the React adapter and the native adapter under @rn-ui-sdk", () => {
  assert.deepEqual(
    manifests()
      .map(({ name }) => name)
      .sort(),
    ["@rn-ui-sdk/core", "@rn-ui-sdk/react", "@rn-ui-sdk/react-native"]
  )
})

test("the three carry the fork's version", () => {
  assert.deepEqual(
    manifests().map((manifest) => manifest.version),
    [version, version, version]
  )
})

test("the adapters take the fork's core as a peer at that version", () => {
  for (const manifest of manifests().filter(
    ({ name }) => name !== "@rn-ui-sdk/core"
  )) {
    assert.equal(manifest.peerDependencies["@rn-ui-sdk/core"], `^${version}`)
  }
})

test("no module, declaration, source map or manifest imports an @ui-sdk/ package", () => {
  const specifier =
    /(\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)\\?["']@ui-sdk\//
  const named = []
  for (const tarball of tarballs) {
    const dir = path.join(unpacked, tarball)
    for (const file of readdirSync(dir, { recursive: true })) {
      const text = /\.(js|ts|map|json)$/.test(file)
        ? readFileSync(path.join(dir, file), "utf8")
        : ""
      const isManifest = path.basename(file) === "package.json"
      if (isManifest ? text.includes("@ui-sdk/") : specifier.test(text)) {
        named.push(path.join(tarball, file))
      }
    }
  }
  assert.deepEqual(named, [])
})

test("core publishes the native build behind the react-native condition", () => {
  const core = manifests().find(({ name }) => name === "@rn-ui-sdk/core")
  assert.equal(
    core.exports["./switch"]["react-native"],
    "./dist/native/components/switch/switch.js"
  )
  assert.equal(core.publishConfig, undefined)
  assert.equal(core.scripts, undefined)
  assert.equal(core.devDependencies, undefined)
})

test("a web bundle of core holds no module of the native build", async () => {
  const core = path.join(unpacked, `rn-ui-sdk-core-${version}.tgz/package`)
  const { exports } = JSON.parse(
    readFileSync(path.join(core, "package.json"), "utf8")
  )
  const { metafile } = await build({
    entryPoints: Object.values(exports)
      .filter((target) => typeof target === "object")
      .map((target) => path.join(core, target.default)),
    bundle: true,
    write: false,
    outdir: "out",
    platform: "browser",
    format: "esm",
    metafile: true,
    logLevel: "silent",
  })
  const inputs = Object.keys(metafile.inputs)
  assert.ok(inputs.some((input) => input.includes("focus/focus-part.js")))
  assert.deepEqual(
    inputs.filter((input) => input.includes("dist/native/")),
    []
  )
})

test("the run leaves the repo as it found it", () => {
  assert.equal(status(), statusBefore)
})
