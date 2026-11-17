import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("color-picker.a11y")

async function byLabel() {
  const nodes = [...(await device.tree()).values()]
  return Object.fromEntries(nodes.map((node) => [node.label, node]))
}

beforeEach(() => device.open("fixture-color-picker"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  const tree = await byLabel()
  assert.equal(tree["Saturation and brightness"]?.role, "slider")
  assert.equal(tree.Hue?.role, "slider")
  assert.equal(tree["Sideways hue"]?.role, "slider")
  assert.equal(tree.Alpha?.role, "textbox")
  assert.equal(tree.Hex?.role, "textbox")
  assert.equal(tree.blue?.role, "image")
  assert.equal(tree["vivid red"]?.role, "button")
  assert.equal(tree.green?.role, "button")
})

test("the platform tree after a drag", async () => {
  const area = await device.rect("area")
  const corner = { x: area.x + area.width - 2, y: area.y + 2 }
  await device.drag(corner, corner, 100)
  await device.expectTree((tree) =>
    assert.match(tree.get("readout")?.text ?? "", /by track-press$/)
  )
  await device.saveTree("pressed")
  const thumb = (await byLabel())["Saturation and brightness"]
  assert.equal(thumb?.role, "slider")
  assert.match(
    String(thumb?.value),
    /Saturation (99|100)%, Brightness (99|100)%/
  )
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})
