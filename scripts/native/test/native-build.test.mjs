import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { after, before, test } from "node:test"

const fixture = path.join(import.meta.dirname, "fixtures/package")
const dist = path.join(fixture, "dist")
const manifestFile = path.join(fixture, "package.json")
const buildScript = path.join(
  import.meta.dirname,
  "../../build/build-package.mjs"
)
const build = () =>
  spawnSync(process.execPath, [buildScript, "--native"], {
    cwd: fixture,
    encoding: "utf8",
  })

let result
before(() => {
  result = build()
})
after(() => {
  rmSync(dist, { recursive: true, force: true })
})

test("the build exits 0", () => {
  assert.equal(result.status, 0, result.stderr)
})

test("dist/native holds the twin's code in the place of its module", () => {
  assert.match(
    readFileSync(path.join(dist, "native/host.js"), "utf8"),
    /"native"/
  )
  assert.match(readFileSync(path.join(dist, "native/index.js"), "utf8"), /host/)
})

test("the DOM tree holds no twin", () => {
  assert.match(readFileSync(path.join(dist, "host.js"), "utf8"), /"dom"/)
  const twins = readdirSync(dist, { recursive: true }).filter((file) =>
    file.includes(".native.")
  )
  assert.deepEqual(twins, [])
})

test("the native tree holds no declarations, which the DOM tree's serve", () => {
  const declarations = readdirSync(path.join(dist, "native"), {
    recursive: true,
  }).filter((file) => file.endsWith(".d.ts"))
  assert.deepEqual(declarations, [])
})

test("#dev's guard picks the real module under __DEV__ and the stub otherwise", () => {
  const guard = readFileSync(path.join(dist, "native/dev.guard.js"), "utf8")
  assert.match(
    guard,
    /__DEV__ \? require\("\.\/dev\.js"\) : require\("\.\/dev-stub\.js"\)/
  )
  assert.match(guard, /export const \{ dev, warn \}/)
  assert.ok(existsSync(path.join(dist, "native/dev-stub.js")))
})

test("an entry with no react-native condition fails the build", (context) => {
  const manifest = readFileSync(manifestFile, "utf8")
  context.after(() => writeFileSync(manifestFile, manifest))
  const parsed = JSON.parse(manifest)
  delete parsed.publishConfig.exports["."]["react-native"]
  writeFileSync(manifestFile, JSON.stringify(parsed, null, 2))
  const { status, stderr } = build()
  assert.equal(status, 1)
  assert.match(stderr, /exports\["\."\] has no "react-native" condition/)
})

test("an import pair with no react-native condition fails the build", (context) => {
  const manifest = readFileSync(manifestFile, "utf8")
  context.after(() => writeFileSync(manifestFile, manifest))
  const parsed = JSON.parse(manifest)
  delete parsed.publishConfig.imports["#dev"]["react-native"]
  writeFileSync(manifestFile, JSON.stringify(parsed, null, 2))
  const { status, stderr } = build()
  assert.equal(status, 1)
  assert.match(stderr, /imports\["#dev"\] has no "react-native" condition/)
})
