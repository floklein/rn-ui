import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("segmented-control.a11y")

async function snapshot() {
  const nodes = [...(await device.tree()).values()].filter(
    (node) => node.role === "radio"
  )
  return Object.fromEntries(nodes.map((node) => [node.label, node]))
}

const item = (label: string, checked = false, enabled = true): Node => ({
  role: "radio",
  label,
  enabled,
  checked,
})

beforeEach(() => device.open("fixture-segmented-control"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  assert.deepEqual(await snapshot(), {
    List: item("List"),
    Grid: item("Grid"),
    Board: item("Board"),
    Table: item("Table", false, false),
    Small: item("Small", true),
    Large: item("Large"),
    Light: item("Light", true, false),
    Dark: item("Dark", false, false),
  })
})

test("the platform tree after an item is pressed", async () => {
  await device.press("item-grid")
  await device.expectTree((tree) =>
    assert.equal(tree.get("last-change")?.text, "grid:item-press:touch")
  )
  await device.saveTree("pressed")
  const tree = await snapshot()
  assert.deepEqual(tree.Grid, item("Grid", true))
  assert.deepEqual(tree.List, item("List"))
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues with an item checked", async () => {
  await device.press("item-grid")
  await device.expectTree((tree) =>
    assert.equal(tree.get("last-change")?.text, "grid:item-press:touch")
  )
  assert.deepEqual(await device.audit(), [])
})
