import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("listbox")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

beforeEach(() => device.open("fixture-listbox"))

test("pressing an option selects it, and another replaces it", async () => {
  await device.press("single-cherry")
  await device.press("single-apple")
  await expectText(
    "changes",
    "single=cherry:item-press single=apple:item-press"
  )
  await device.expectTree((tree) => {
    assert.equal(tree.get("single-apple")?.selected, true)
    assert.notEqual(tree.get("single-cherry")?.selected, true)
  })
})

test("a disabled option can't be chosen", async () => {
  await device.press("single-banana")
  await device.press("single-cherry")
  await expectText("changes", "single=cherry:item-press")
})

test("with multiple, presses toggle options", async () => {
  await device.press("multi-apple")
  await device.press("multi-nuts")
  await device.press("multi-cherry")
  await expectText(
    "changes",
    "multi=cherry+apple multi=cherry+apple+nuts multi=apple+nuts"
  )
})

test("the controller selects every enabled option", async () => {
  await device.press("select-all")
  await expectText("changes", "multi=cherry+apple+nuts")
  await device.expectTree((tree) =>
    assert.notEqual(tree.get("multi-banana")?.selected, true)
  )
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/listbox/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-listbox-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) => assert.ok(tree.size > 1))
  }
})
