import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("image-cropper.a11y")

async function byLabel() {
  const nodes = [...(await device.tree()).values()]
  return Object.fromEntries(nodes.map((node) => [node.label, node]))
}

beforeEach(() => device.open("fixture-image-cropper"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  const tree = await byLabel()
  assert.equal(tree["Avatar crop"]?.role, "slider")
  assert.equal(tree["Cover crop"]?.role, "slider")
  assert.match(String(tree["Cover crop"]?.value), /by \d+ pixels, at \d+, \d+/)
  assert.equal(tree["Top left corner"]?.role, "slider")
  assert.equal(tree["Bottom right corner"]?.role, "slider")
  assert.equal(tree.Zoom?.role, "slider")
  assert.equal(tree.Zoom?.value, "100%")
  assert.ok(tree.Hills, "the image is read by its alt")
})

test("the platform tree after a pinch", async () => {
  const frame = await device.rect("frame")
  await device.pinch(
    { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 },
    40,
    120
  )
  await device.expectTree((tree) =>
    assert.match(tree.get("readout")?.text ?? "", /by pinch$/)
  )
  await device.saveTree("pinched")
  const zoom = (await byLabel()).Zoom
  assert.match(String(zoom?.value), /^[1-4]\d\d%$/)
  assert.notEqual(zoom?.value, "100%")
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})
