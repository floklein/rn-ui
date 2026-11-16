import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("slider")

beforeEach(() => device.open("fixture-slider"))

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

// Positions on screen land within a step or two of a value.
async function expectNear(id: string, pattern: RegExp, near: number) {
  const deadline = Date.now() + 5000
  for (;;) {
    const text = await readout(id)
    const value = Number(pattern.exec(text)?.[1])
    if (Math.abs(value - near) <= 3) {
      return text
    }
    assert.ok(Date.now() < deadline, `${id} reads "${text}", not near ${near}`)
  }
}

test("a drag moves the thumb and commits once when it lifts", async () => {
  const track = await device.rect("track")
  const thumb = center(await device.rectNamed("Volume"))
  await device.drag(thumb, { x: track.x + track.width * 0.8, y: thumb.y })
  const text = await expectNear("readout", /^Volume (\d+)/, 80)
  assert.match(text, /saved \d+ by drag$/)
})

test("a press on the track moves the nearest thumb there", async () => {
  const track = await device.rect("track")
  const at = { x: track.x + track.width * 0.6, y: track.y + track.height / 2 }
  await device.drag(at, at, 100)
  const text = await expectNear("readout", /^Volume (\d+)/, 60)
  assert.match(text, /saved \d+ by track-press$/)
})

test("inside a scroll view along the same axis that stops scrolling while dragging, a drag moves the slider and the view stays", async () => {
  const thumb = center(await device.rectNamed("Balance"))
  const control = await device.rect("balance-control")
  await device.drag(thumb, { x: thumb.x - control.width * 0.3, y: thumb.y })
  await expectNear("scroll-readout", /^Balance (\d+)/, 20)
  assert.match(await readout("scroll-readout"), /scrolled 0;/)
})

test("a drag that moves at once still leaves a same-axis scroll view in place", async () => {
  const thumb = center(await device.rectNamed("Balance"))
  const control = await device.rect("balance-control")
  await device.drag(
    thumb,
    { x: thumb.x - control.width * 0.3, y: thumb.y },
    300,
    0
  )
  await expectNear("scroll-readout", /^Balance (\d+)/, 20)
  assert.match(await readout("scroll-readout"), /scrolled 0;/)
})

test("beside the slider, the same swipe scrolls the view", async () => {
  const view = await device.rect("sideways")
  const control = await device.rect("balance-control")
  const y = view.y + view.height / 2
  const start = control.x + control.width + view.width * 0.3
  await device.drag(
    { x: Math.min(start, view.x + view.width - 10), y },
    {
      x: view.x + 10,
      y,
    }
  )
  await device.expectTree((tree) => {
    const text = tree.get("scroll-readout")?.text ?? ""
    assert.doesNotMatch(text, /scrolled 0;/)
    assert.match(text, /^Balance 50,/)
  })
})

test("a vertical slider in a vertical scroll view that stops scrolling while dragging grows upward and the view stays", async () => {
  const thumb = center(await device.rectNamed("Level"))
  const control = await device.rect("level-control")
  await device.drag(thumb, { x: thumb.x, y: thumb.y - control.height * 0.3 })
  await expectNear("scroll-readout", /level (\d+)/, 80)
  assert.match(await readout("scroll-readout"), /lifted 0;/)
})

test("a horizontal slider in a vertical scroll view moves with nothing from the app", async () => {
  const thumb = center(await device.rectNamed("Tilt"))
  const control = await device.rect("tilt-control")
  await device.drag(thumb, { x: thumb.x + control.width * 0.3, y: thumb.y })
  await expectNear("scroll-readout", /tilt (\d+)/, 80)
})

test("values format in the device's language", async () => {
  const locale = (await readout("locale")).replace("Locale ", "")
  assert.match(locale, /^[a-z]{2}-[A-Z]{2}$/)
  assert.equal(
    await readout("amount"),
    new Intl.NumberFormat(locale, { minimumFractionDigits: 1 }).format(1234.5)
  )
})

test("each example opens", async () => {
  const examples = path.join(
    import.meta.dirname,
    "../../examples/components/slider/react-native"
  )
  for (const file of readdirSync(examples)) {
    await device.open(`screen-slider-${file.replace(/\.tsx$/, "")}`)
  }
})
