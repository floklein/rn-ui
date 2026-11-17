import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("listbox.a11y")

beforeEach(() => device.open("fixture-listbox"))

test("the platform tree: each option is a button, the chosen one selected, a disabled one disabled", async () => {
  await device.press("single-cherry")
  await device.expectTree((tree) =>
    assert.equal(tree.get("single-cherry")?.selected, true)
  )
  await device.saveTree("chosen")
  const tree = await device.tree()
  assert.deepEqual(tree.get("single-cherry"), {
    role: "button",
    label: "Cherry",
    selected: true,
    enabled: true,
  })
  assert.deepEqual(tree.get("single-apple"), {
    role: "button",
    label: "Apple",
    enabled: true,
  })
  assert.equal(tree.get("single-banana")?.label, "Banana")
  if (device.platform === "android") {
    assert.equal(tree.get("single-banana")?.enabled, false)
  }
  assert.equal(tree.get("multi-cherry")?.selected, true)
})

test("the group label and the separator: the label is text, the separator hidden", async () => {
  const tree = await device.tree()
  assert.equal(tree.get("multi-group")?.text, "Fruits")
  assert.equal(tree.has("multi-separator"), false)
})

test("no audit issues", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues once an option is chosen", async () => {
  await device.press("multi-apple")
  assert.deepEqual(await device.audit(), [])
})
