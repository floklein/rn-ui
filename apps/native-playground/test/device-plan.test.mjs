import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { after, test } from "node:test"
import { plan, specsOf } from "../../../scripts/device-specs.mjs"

const repo = mkdtempSync(path.join(tmpdir(), "device-plan-"))
after(() => rmSync(repo, { recursive: true, force: true }))

function write(file, text = "") {
  mkdirSync(path.dirname(path.join(repo, file)), { recursive: true })
  writeFileSync(path.join(repo, file), text)
}

write(
  "packages/core/package.json",
  JSON.stringify({
    exports: {
      "./switch": "./src/components/switch/switch.ts",
      "./checkbox": "./src/components/checkbox/checkbox.ts",
    },
  })
)
write(
  "packages/core/src/components/switch/switch.ts",
  'import { toggle } from "../../foundation/forms/toggle"\n'
)
write(
  "packages/core/src/components/checkbox/checkbox.ts",
  'import { toggle } from "../../foundation/forms/toggle"\n'
)
write(
  "packages/core/src/foundation/forms/toggle.ts",
  'import { focusPart } from "../focus/focus-part"\n'
)
write("packages/core/src/foundation/focus/focus-part.ts")
write("packages/core/src/foundation/focus/focus-part.native.ts")
write("packages/core/src/components/menu/menu.ts")
write(
  "packages/react-native/src/switch.tsx",
  'import { switchPrimitive } from "@ui-sdk/core/switch"\nimport { createParts } from "./use-primitive"\n'
)
write(
  "packages/react-native/src/checkbox.tsx",
  'import { checkboxPrimitive } from "@ui-sdk/core/checkbox"\nimport { createParts } from "./use-primitive"\n'
)
write("packages/react-native/src/use-primitive.tsx")
write("tests/native/device.ts")
write("tests/native/switch.spec.ts")
write("tests/native/switch.a11y.spec.ts")
write("tests/native/checkbox.spec.ts")

const planned = (...files) => plan(files, repo).components

test("a component's native entry plans only that component's specs", () => {
  assert.deepEqual(planned("packages/react-native/src/switch.tsx"), ["switch"])
  assert.deepEqual(specsOf(["switch"], repo), [
    "tests/native/switch.a11y.spec.ts",
    "tests/native/switch.spec.ts",
  ])
})

test("a component's core module, example, fixture or spec plans only that component", () => {
  assert.deepEqual(planned("packages/core/src/components/switch/switch.ts"), [
    "switch",
  ])
  assert.deepEqual(
    planned("examples/components/switch/react-native/basic.tsx"),
    ["switch"]
  )
  assert.deepEqual(planned("apps/native-playground/fixtures/switch.tsx"), [
    "switch",
  ])
  assert.deepEqual(planned("tests/native/switch.a11y.spec.ts"), ["switch"])
})

test("core code plans every component whose native entry imports it, a twin included", () => {
  assert.deepEqual(planned("packages/core/src/foundation/forms/toggle.ts"), [
    "checkbox",
    "switch",
  ])
  assert.deepEqual(
    planned("packages/core/src/foundation/focus/focus-part.native.ts"),
    ["checkbox", "switch"]
  )
})

test("code no native entry imports plans nothing", () => {
  assert.deepEqual(planned("packages/core/src/components/menu/menu.ts"), [])
  assert.deepEqual(planned("examples/components/switch/react/basic.tsx"), [])
  assert.deepEqual(planned("apps/native-playground/test/screens.test.mjs"), [])
  assert.deepEqual(planned("README.md"), [])
})

test("the harness, the playground's app and the lockfile plan every spec", () => {
  for (const file of [
    "tests/native/device.ts",
    "apps/native-playground/App.tsx",
    "apps/native-playground/scripts/build-app.sh",
    "pnpm-lock.yaml",
  ]) {
    assert.deepEqual(plan([file], repo), {
      components: ["checkbox", "switch"],
      shared: [file],
    })
  }
})
