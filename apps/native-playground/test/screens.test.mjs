import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { test } from "node:test"

const app = path.join(import.meta.dirname, "..")
const examples = path.join(app, "../../examples/components")

function bundledSources(platform) {
  const out = mkdtempSync(path.join(tmpdir(), "native-playground-"))
  try {
    const { status, stderr } = spawnSync(
      "npx",
      [
        "expo",
        "export",
        "--platform",
        platform,
        "--source-maps",
        "--output-dir",
        out,
      ],
      { cwd: app, encoding: "utf8" }
    )
    assert.equal(status, 0, stderr)
    const dir = path.join(out, "_expo/static/js", platform)
    const map = readdirSync(dir).find((file) => file.endsWith(".map"))
    return JSON.parse(readFileSync(path.join(dir, map), "utf8")).sources
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
}

test("an example file added under examples/components/<name>/react-native is bundled as a screen", () => {
  const component = `probe-${process.pid}`
  const folder = path.join(examples, component, "react-native")
  mkdirSync(folder, { recursive: true })
  writeFileSync(
    path.join(folder, "added.tsx"),
    'import { Text } from "react-native"\n\nfunction Example() {\n  return <Text>Added</Text>\n}\n\nexport { Example }\n'
  )
  try {
    const sources = bundledSources("ios")
    assert.ok(
      sources.some((source) =>
        source.endsWith(`${component}/react-native/added.tsx`)
      ),
      "the added example is in the bundle"
    )
  } finally {
    rmSync(path.join(examples, component), { recursive: true, force: true })
  }
})

test("the bundle holds the native twin of focusing a part, not its DOM module", () => {
  for (const platform of ["ios", "android"]) {
    const sources = bundledSources(platform)
    assert.ok(
      sources.some((source) => source.endsWith("focus/focus-part.native.ts"))
    )
    assert.ok(!sources.some((source) => source.endsWith("focus/focus-part.ts")))
  }
})
