import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("slider.a11y")

async function sliders() {
  const nodes = [...(await device.tree()).values()].filter(
    (node) => node.role === "slider"
  )
  return Object.fromEntries(nodes.map((node) => [node.label, node]))
}

const slider = (label: string, value: string): Node => ({
  role: "slider",
  label,
  enabled: true,
  value,
})

beforeEach(() => device.open("fixture-slider"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  const tree = await sliders()
  assert.deepEqual(tree.Volume, slider("Volume", "20"))
  assert.deepEqual(tree.Balance, slider("Balance", "50"))
  assert.deepEqual(tree.Level, slider("Level", "50"))
  assert.deepEqual(tree.Tilt, slider("Tilt", "50"))
  assert.equal(tree.Amount?.role, "slider")
})

test("the platform tree after a drag", async () => {
  const track = await device.rect("track")
  const thumb = await device.rectNamed("Volume")
  const y = thumb.y + thumb.height / 2
  await device.drag(
    { x: thumb.x + thumb.width / 2, y },
    { x: track.x + track.width * 0.8, y }
  )
  await device.expectTree((tree) =>
    assert.match(tree.get("readout")?.text ?? "", /saved \d+ by drag$/)
  )
  await device.saveTree("dragged")
  const volume = (await sliders()).Volume
  assert.equal(volume?.role, "slider")
  assert.notEqual(volume?.value, "20")
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})
