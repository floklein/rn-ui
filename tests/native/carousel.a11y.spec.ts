import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("carousel.a11y")

beforeEach(() => device.open("fixture-carousel"))

const dots = ["dot-Dunes", "dot-Forest", "dot-Glacier", "dot-Canyon"]

test("each indicator is its own element, the current page's selected", async () => {
  await device.saveTree("first")
  const tree = await device.tree()
  for (const id of dots) {
    assert.ok(tree.has(id), `${id} isn't an element`)
  }
  assert.equal(tree.get("dot-Dunes")?.selected, true)
  assert.equal(tree.get("dot-Forest")?.selected, undefined)
})

test("only the slide in view is read, labelled by its place", async () => {
  const tree = await device.tree()
  assert.equal(tree.has("slide-Forest"), false)
  await device.press("next")
  await device.expectTree((tree) => {
    assert.equal(tree.get("dot-Forest")?.selected, true)
    assert.equal(tree.has("slide-Dunes"), false)
  })
  await device.saveTree("second")
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})
