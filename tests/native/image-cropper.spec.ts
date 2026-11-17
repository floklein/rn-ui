import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("image-cropper")

beforeEach(() => device.open("fixture-image-cropper"))

const center = (box: {
  x: number
  y: number
  width: number
  height: number
}) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
})

async function expectReadout(id: string, pattern: RegExp) {
  await device.expectTree((tree) =>
    assert.match(tree.get(id)?.text ?? "", pattern)
  )
  return (await device.node(id)).text ?? ""
}

const frameWidth = (text: string) =>
  Number(/^Frame (\d+)x/.exec(text)?.[1] ?? Number.NaN)

test("two fingers spreading on a frame zoom the image in, and commit once as a pinch", async () => {
  const before = frameWidth(await expectReadout("readout", /^Frame \d+x\d+/))
  await device.pinch(center(await device.rect("frame")), 40, 120)
  const text = await expectReadout("readout", /saved \d+ by pinch$/)
  assert.ok(
    frameWidth(text) < before * 0.6,
    `the crop narrowed from ${before}: ${text}`
  )
  assert.match(text, new RegExp(`saved ${frameWidth(text)} by pinch$`))
})

test("two fingers closing on a zoomed frame zoom it back out", async () => {
  const frame = center(await device.rect("frame"))
  await device.pinch(frame, 40, 120)
  const zoomed = frameWidth(await expectReadout("readout", /by pinch$/))
  await device.pinch(frame, 120, 40)
  await device.expectTree((tree) =>
    assert.ok(frameWidth(tree.get("readout")?.text ?? "") > zoomed)
  )
})

test("one finger pans the image under a frame", async () => {
  const frame = center(await device.rect("frame"))
  await device.pinch(frame, 40, 120)
  await expectReadout("readout", /by pinch$/)
  await device.drag(frame, { x: frame.x + 40, y: frame.y + 30 })
  await expectReadout("readout", /saved \d+ by drag$/)
})

test("a touch on the zoom track zooms there", async () => {
  const zoom = await device.rect("zoom")
  const end = { x: zoom.x + zoom.width - 4, y: zoom.y + zoom.height / 2 }
  await device.drag(end, end, 100)
  await expectReadout("readout", /^Frame (\d+)x\1 .*saved \1 by zoom-input$/)
})

test("inside a scroll view along the same axis that stops scrolling while dragging, a selection drag moves the crop and the view stays", async () => {
  const selection = center(await device.rect("cover"))
  await device.drag(selection, { x: selection.x, y: selection.y + 30 })
  const text = await expectReadout(
    "scroll-readout",
    /^Cover (\S+ at \d+,\d+) kept \1, lifted \d+$/
  )
  assert.doesNotMatch(text, /kept 256x168 at 32,21/)
  assert.match(text, /lifted 0$/)
})

test("a handle drag that moves at once resizes the crop and leaves a same-axis scroll view in place", async () => {
  const handle = center(await device.rectNamed("Bottom right corner"))
  await device.drag(handle, { x: handle.x - 40, y: handle.y - 40 }, 300, 0)
  const text = await expectReadout(
    "scroll-readout",
    /^Cover (\S+ at \d+,\d+) kept \1, lifted \d+$/
  )
  assert.doesNotMatch(text, /kept 256x168/)
  assert.match(text, /at 32,21 kept/)
  assert.match(text, /lifted 0$/)
})

test("beside the cropper, a swipe scrolls the view", async () => {
  const view = await device.rect("upright")
  const x = view.x + view.width / 2
  await device.drag(
    { x, y: view.y + view.height - 20 },
    { x, y: view.y + view.height - 140 }
  )
  await device.expectTree((tree) => {
    const text = tree.get("scroll-readout")?.text ?? ""
    assert.doesNotMatch(text, /lifted 0$/)
    assert.match(text, /^Cover 256x168 at 32,21 kept 256x168 at 32,21,/)
  })
})

test("each example opens", async () => {
  const examples = path.join(
    import.meta.dirname,
    "../../examples/components/image-cropper/react-native"
  )
  for (const file of readdirSync(examples)) {
    await device.open(`screen-image-cropper-${file.replace(/\.tsx$/, "")}`)
  }
})
