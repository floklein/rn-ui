import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("separator")

const separators = [
  "separator-flip",
  "separator-vertical",
  "separator-decorative",
]

beforeEach(() => device.open("fixture-separator"))

test("a separator carries its orientation for styling", async () => {
  const before = await device.size("separator-flip")
  assert.ok(before.width > before.height)
  const vertical = await device.size("separator-vertical")
  assert.ok(vertical.height > vertical.width)
  await device.press("flip-orientation")
  const deadline = Date.now() + 5000
  for (;;) {
    const after = await device.size("separator-flip")
    if (after.height > after.width) {
      break
    }
    assert.ok(Date.now() < deadline, "the separator never turned vertical")
  }
})

test("a separator can't be focused", async () => {
  for (const id of separators) {
    const attrs = await device.attributes(id)
    if (device.platform === "ios") {
      assert.equal(attrs.accessible, "false", id)
    } else {
      assert.equal(attrs.focusable, "false", id)
      assert.equal(attrs.clickable, "false", id)
    }
  }
})

const shown = ["Hollis Grant", "or", "Plan", "Projects", "Privacy"]

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/separator/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-separator-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok(
        [...tree.values()].some(
          (node) =>
            shown.includes(node.text ?? "") || shown.includes(node.label)
        )
      )
    )
  }
})
