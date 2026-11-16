import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("collapsible")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

beforeEach(() => device.open("fixture-collapsible"))

test("pressing the trigger opens the panel, from a touch, and opening settles at once", async () => {
  await expectText("collapsible-changes", "none")
  assert.equal((await device.tree()).has("panel-text"), false)
  await device.press("trigger")
  await expectText("collapsible-changes", "true:trigger-press:touch")
  await expectText("panel-text", "Linen shirt")
  await expectText("collapsible-completes", "true")
})

test("the panel's state holds its content's measured height", async () => {
  await device.press("trigger")
  await device.expectTree((tree) =>
    assert.ok(Number(tree.get("panel-size")?.text) > 0)
  )
})

test("closing keeps the panel through onExit, hidden, until done, at the size it had", async () => {
  await device.press("trigger")
  await device.expectTree((tree) =>
    assert.ok(Number(tree.get("panel-size")?.text) > 0)
  )
  const open = (await device.node("panel-size")).text
  await device.press("trigger")
  await expectText(
    "collapsible-changes",
    "true:trigger-press:touch false:trigger-press:touch"
  )
  const tree = await device.tree()
  assert.equal(tree.has("panel-text"), false)
  assert.equal(tree.get("panel-size")?.text, open)
  assert.equal(tree.get("collapsible-completes")?.text, "true")
  await device.press("finish-exit")
  await expectText("collapsible-completes", "true false")
  assert.equal((await device.tree()).has("panel"), false)
})

test("the controller opens and closes it", async () => {
  await device.press("toggle")
  await expectText("collapsible-changes", "true:imperative:programmatic")
  await expectText("panel-text", "Linen shirt")
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/collapsible/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-collapsible-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.role === "button"))
    )
  }
})
