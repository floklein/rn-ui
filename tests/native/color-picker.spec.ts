import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("color-picker")

beforeEach(() => device.open("fixture-color-picker"))

const center = (box: {
  x: number
  y: number
  width: number
  height: number
}) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
})

async function readout(id: string) {
  return (await device.node(id)).text ?? ""
}

async function expectReadout(id: string, pattern: RegExp) {
  await device.expectTree((tree) =>
    assert.match(tree.get(id)?.text ?? "", pattern)
  )
  return readout(id)
}

test("a press on the area moves the color there, and commits when it lifts", async () => {
  const area = await device.rect("area")
  const corner = { x: area.x + area.width - 2, y: area.y + 2 }
  await device.drag(corner, corner, 100)
  const text = await expectReadout(
    "readout",
    /^Value (#\w{6}), saved \1 by track-press$/
  )
  assert.doesNotMatch(text, /#0ea5e9/)
})

test("a drag across the area follows the finger and commits once", async () => {
  const area = await device.rect("area")
  await device.drag(
    { x: area.x + area.width * 0.5, y: area.y + area.height * 0.5 },
    { x: area.x + 2, y: area.y + area.height - 2 }
  )
  await expectReadout("readout", /^Value #0\w0\w0\w, saved #0\w0\w0\w by drag$/)
})

test("a drag along the hue slider moves the hue and commits once", async () => {
  const hue = await device.rect("hue")
  const thumb = center(await device.rectNamed("Hue"))
  await device.drag(thumb, { x: hue.x + hue.width / 2, y: thumb.y })
  const text = await expectReadout("readout", /saved #\w+ by drag$/)
  assert.doesNotMatch(text, /^Value #0ea5e9/)
})

test("a swatch press picks its color", async () => {
  await device.pressNamed("green")
  await expectReadout("readout", /^Value #22c55e, saved #22c55e by item-press$/)
})

test("inside a scroll view along the same axis that stops scrolling while dragging, a slider drag moves the hue and the view stays", async () => {
  const thumb = center(await device.rectNamed("Sideways hue"))
  const track = await device.rect("sideways-hue")
  await device.drag(thumb, { x: thumb.x + track.width * 0.5, y: thumb.y })
  const text = await expectReadout(
    "scroll-readout",
    /^Hue #\w+ kept #(?!ff0000)/
  )
  assert.match(text, /scrolled 0;/)
})

test("a drag that moves at once still leaves a same-axis scroll view in place", async () => {
  const thumb = center(await device.rectNamed("Sideways hue"))
  const track = await device.rect("sideways-hue")
  await device.drag(
    thumb,
    { x: thumb.x + track.width * 0.5, y: thumb.y },
    300,
    0
  )
  const text = await expectReadout(
    "scroll-readout",
    /^Hue #\w+ kept #(?!ff0000)/
  )
  assert.match(text, /scrolled 0;/)
})

test("an area drag in a vertical scroll view that stops scrolling while dragging moves the color and the view stays", async () => {
  const area = await device.rect("upright-area")
  const thumb = center(await device.rectNamed("Upright color"))
  await device.drag(thumb, { x: thumb.x, y: area.y + 2 })
  const text = await expectReadout(
    "scroll-readout",
    /area #\w+ kept #(?!808080)/
  )
  assert.match(text, /lifted 0$/)
})

test("beside the slider, a swipe scrolls the view", async () => {
  const view = await device.rect("sideways")
  const track = await device.rect("sideways-hue")
  const y = view.y + view.height / 2
  const start = Math.min(track.x + track.width + 40, view.x + view.width - 10)
  await device.drag({ x: start, y }, { x: view.x + 10, y })
  await device.expectTree((tree) => {
    const text = tree.get("scroll-readout")?.text ?? ""
    assert.doesNotMatch(text, /scrolled 0;/)
    assert.match(text, /^Hue #ff0000 kept #ff0000,/)
  })
})

test("each example opens", async () => {
  const examples = path.join(
    import.meta.dirname,
    "../../examples/components/color-picker/react-native"
  )
  for (const file of readdirSync(examples)) {
    await device.open(`screen-color-picker-${file.replace(/\.tsx$/, "")}`)
  }
})
