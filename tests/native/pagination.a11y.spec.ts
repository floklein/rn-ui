import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("pagination.a11y")

const ids = ["first", "previous", "next", "last"]

async function snapshot() {
  const tree = await device.tree()
  return [...tree.entries()]
    .filter(
      ([id, node]) =>
        ids.includes(id) || (node.role === "button" && /^\d+$/.test(node.label))
    )
    .map(([, node]) => node)
}

const button = (label: string, enabled = true): Node => ({
  role: "button",
  label,
  enabled,
})

const current = (label: string): Node => ({
  ...button(label),
  selected: true,
})

beforeEach(() => device.open("fixture-pagination"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  assert.deepEqual(await snapshot(), [
    button("First", false),
    button("Previous", false),
    current("1"),
    button("2"),
    button("3"),
    button("4"),
    button("5"),
    button("12"),
    button("Next"),
    button("Last"),
  ])
})

test("the platform tree on a page in the middle", async () => {
  await device.press("set-page")
  await device.expectTree((tree) =>
    assert.equal(tree.get("page-value")?.text, "7:imperative:programmatic")
  )
  await device.saveTree("middle")
  assert.deepEqual(await snapshot(), [
    button("First"),
    button("Previous"),
    button("1"),
    button("6"),
    current("7"),
    button("8"),
    button("12"),
    button("Next"),
    button("Last"),
  ])
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues on a page in the middle", async () => {
  await device.press("set-page")
  await device.expectTree((tree) =>
    assert.equal(tree.get("page-value")?.text, "7:imperative:programmatic")
  )
  assert.deepEqual(await device.audit(), [])
})
