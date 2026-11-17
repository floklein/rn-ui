import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("scroll-area.a11y")

beforeEach(() => device.open("fixture-scroll-area"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  const tree = await device.tree()
  assert.ok(tree.get("list"), "the viewport is in the tree")
  assert.equal(tree.get("list-scrollbar"), undefined)
  assert.equal(tree.get("list-thumb"), undefined)
  const labels = [...tree.values()].map((node) => node.label)
  assert.ok(labels.includes("Row 1"), "the content is read")
  assert.ok(labels.includes("Latest"), "the scroll-to-end button is read")
})

test("the scroll-to-end button leaves the tree at the end", async () => {
  await device.pressNamed("Latest")
  await device.expectTree((tree) => {
    assert.match(tree.get("list-readout")?.text ?? "", /^List at end,/)
    assert.ok(
      ![...tree.values()].some((node) => node.label === "Latest"),
      "Latest is gone"
    )
  })
  await device.saveTree("at-end")
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})
