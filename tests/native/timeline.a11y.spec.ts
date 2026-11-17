import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("timeline.a11y")

beforeEach(() => device.open("fixture-timeline"))

test("the platform tree: an accessible event is one element named by its title, and a container's texts and controls are their own", async () => {
  await device.saveTree("first")
  await device.expectTree((tree) => {
    for (const index of [2, 3]) {
      const event = tree.get(`event-${index}`)
      assert.ok(event, `event-${index} isn't in the tree`)
      assert.match(event.label, new RegExp(`^Event ${index}\\b`))
    }
    assert.equal(tree.get("event-1-place")?.text, "Place 0, first")
    assert.equal(tree.get("release-trigger")?.role, "button")
  })
})

test("no audit issues", async () => {
  assert.deepEqual(await device.audit(), [])
})
