import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("timeline")

beforeEach(() => device.open("fixture-timeline"))

test("a swipe that starts on an event scrolls the same-axis ScrollView around the timeline", async () => {
  const event = await device.rect("event-2")
  const x = event.x + event.width / 2
  await device.drag(
    { x, y: event.y + event.height },
    { x, y: event.y - event.height },
    300,
    0
  )
  await device.expectTree((tree) =>
    assert.match(
      tree.get("timeline-readout")?.text ?? "",
      /^Scrolled [1-9]\d*$/
    )
  )
})

test("each event's state has its place and status, and the first and last are marked", async () => {
  await device.expectTree((tree) => {
    assert.equal(tree.get("event-1-place")?.text, "Place 0, first")
    assert.equal(tree.get("event-4-place")?.text, "Place 3")
    assert.equal(tree.get("release-place")?.text, "Status current")
  })
})

test("a control inside an event is pressed on its own", async () => {
  await device.press("release-trigger")
  await device.expectTree((tree) =>
    assert.equal(tree.get("release-notes")?.text, "Faster search.")
  )
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/timeline/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-timeline-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.label || node.text))
    )
  }
})
