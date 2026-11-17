import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("carousel")

beforeEach(() => device.open("fixture-carousel"))

async function expectReadout(id: string, text: string | RegExp) {
  await device.expectTree((tree) => {
    const shown = tree.get(id)?.text ?? ""
    if (typeof text === "string") {
      assert.equal(shown, text)
    } else {
      assert.match(shown, text)
    }
  })
}

test("Next and an indicator page, and the slides come to rest there", async () => {
  await device.press("next")
  await expectReadout("readout", "Page 2, rested 2")
  await device.press("dot-Canyon")
  await expectReadout("readout", "Page 4, rested 4")
})

test("a swipe toward the start goes to the next page when the finger lifts", async () => {
  const view = await device.rect("viewport")
  const y = view.y + view.height / 2
  await device.drag(
    { x: view.x + view.width * 0.8, y },
    { x: view.x + view.width * 0.2, y }
  )
  await expectReadout("readout", "Page 2, rested 2")
})

test("a tap on a slide pages nowhere", async () => {
  await device.press("slide-Dunes")
  await expectReadout("readout", "Page 1, rested 1")
})

test("inside a same-axis ScrollView whose scrolling the drag turns off, a swipe pages and the view stays", async () => {
  const view = await device.rect("gallery")
  const y = view.y + view.height / 2
  await device.drag(
    { x: view.x + view.width * 0.8, y },
    { x: view.x + view.width * 0.2, y },
    300,
    0
  )
  await expectReadout("scroll-readout", /^Gallery 2, scrolled 0;/)
})

test("beside the carousel, a swipe on the same ScrollView still scrolls it", async () => {
  const view = await device.rect("sideways")
  const gallery = await device.rect("gallery")
  const y = gallery.y + gallery.height / 2
  const x = gallery.x - 20
  await device.drag({ x, y }, { x: x - 150, y })
  await expectReadout("scroll-readout", /^Gallery 1, scrolled [1-9]\d*;/)
  assert.ok(view.width > 0)
})

test("a swipe across the carousel's axis scrolls the screen and pages nowhere", async () => {
  const view = await device.rect("cross")
  const x = view.x + view.width / 2
  await device.drag(
    { x, y: view.y + view.height * 0.9 },
    { x, y: view.y - view.height }
  )
  await expectReadout("scroll-readout", /upright 1, lifted [1-9]\d*$/)
})
