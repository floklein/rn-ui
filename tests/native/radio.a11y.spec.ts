import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("radio.a11y")

async function snapshot() {
  const nodes = [...(await device.tree()).values()].filter(
    (node) => node.role === "radio"
  )
  return Object.fromEntries(nodes.map((node) => [node.label, node]))
}

const radio = (label: string, checked = false, enabled = true): Node => ({
  role: "radio",
  label,
  enabled,
  checked,
})

beforeEach(() => device.open("fixture-radio"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  assert.deepEqual(await snapshot(), {
    Small: radio("Small"),
    Medium: radio("Medium", true),
    Large: radio("Large", false, false),
    Free: radio("Free"),
    Pro: radio("Pro", true),
    Light: radio("Light", true, false),
    Dark: radio("Dark", false, false),
  })
})

test("the platform tree after a radio is pressed", async () => {
  await device.press("radio-small")
  await device.expectTree((tree) =>
    assert.equal(tree.get("last-change")?.text, "small:item-press:touch")
  )
  await device.saveTree("pressed")
  const tree = await snapshot()
  assert.deepEqual(tree.Small, radio("Small", true))
  assert.deepEqual(tree.Medium, radio("Medium"))
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues with a radio pressed", async () => {
  await device.press("radio-small")
  await device.expectTree((tree) =>
    assert.equal(tree.get("last-change")?.text, "small:item-press:touch")
  )
  assert.deepEqual(await device.audit(), [])
})
