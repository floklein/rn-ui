import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("calendar.a11y")

const day = (label: string, more: Partial<Node> = {}): Node => ({
  role: "button",
  label,
  enabled: true,
  ...more,
})

async function snapshot(labels: string[]) {
  const tree = await device.tree()
  return labels.map((label) =>
    [...tree.values()].find((node) => node.label === label)
  )
}

beforeEach(() => device.open("fixture-calendar"))

test("the platform tree: steps and days are buttons, the selected day selected", async () => {
  await device.saveTree("first")
  const tree = await device.tree()
  assert.deepEqual(tree.get("previous"), day("Previous month"))
  assert.deepEqual(tree.get("next"), day("Next month"))
  assert.equal(tree.get("heading")?.text, "October 2026")
  assert.deepEqual(
    await snapshot([
      "Friday, October 16, 2026",
      "Saturday, October 17, 2026",
      "Thursday, October 8, 2026",
    ]),
    [
      day("Friday, October 16, 2026", { selected: true }),
      day("Saturday, October 17, 2026"),
      day("Thursday, October 8, 2026", { enabled: false }),
    ]
  )
})

test("the platform tree after a press: the selection moves", async () => {
  await device.pressNamed("Tuesday, October 20, 2026")
  await device.expectTree((tree) =>
    assert.equal(tree.get("value-readout")?.text, "2026-10-20:item-press:touch")
  )
  await device.saveTree("pressed")
  assert.deepEqual(
    await snapshot(["Friday, October 16, 2026", "Tuesday, October 20, 2026"]),
    [
      day("Friday, October 16, 2026"),
      day("Tuesday, October 20, 2026", { selected: true }),
    ]
  )
})

test("no audit issues", async () => {
  assert.deepEqual(await device.audit(), [])
})
