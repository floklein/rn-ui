import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("rating.a11y")

async function snapshot() {
  const nodes = [...(await device.tree()).values()].filter(
    (node) => node.role === "radio" || node.role === "image"
  )
  return Object.fromEntries(nodes.map((node) => [node.label, node]))
}

const radio = (label: string, checked = false, enabled = true): Node => ({
  role: "radio",
  label,
  enabled,
  checked,
})

const scores = (
  name: string,
  values: number[],
  checked: number | null,
  enabled = true
) =>
  Object.fromEntries(
    values.map((value) => [
      `${name} ${value}`,
      radio(`${name} ${value}`, value === checked, enabled),
    ])
  )

const half = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

beforeEach(() => device.open("fixture-rating"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  assert.deepEqual(await snapshot(), {
    ...scores("Food", [1, 2, 3, 4, 5], null),
    ...scores("Room", half, 2.5),
    ...scores("Service", [1, 2, 3], 2, false),
    "Rated 4.2 out of 5": {
      role: "image",
      label: "Rated 4.2 out of 5",
      enabled: true,
    },
  })
})

test("the platform tree after stars are pressed", async () => {
  await device.pressNamed("Food 4")
  await device.pressNamed("Room 1")
  await device.expectTree((tree) =>
    assert.equal(tree.get("room-value")?.text, "1")
  )
  await device.saveTree("pressed")
  const tree = await snapshot()
  assert.deepEqual(tree["Food 4"], radio("Food 4", true))
  assert.deepEqual(tree["Room 1"], radio("Room 1", true))
  assert.deepEqual(tree["Room 2.5"], radio("Room 2.5"))
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues with stars pressed", async () => {
  await device.pressNamed("Food 4")
  await device.expectTree((tree) =>
    assert.equal(tree.get("food-value")?.text, "4:touch")
  )
  assert.deepEqual(await device.audit(), [])
})
