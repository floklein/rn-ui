import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("scroll-area")

beforeEach(() => device.open("fixture-scroll-area"))

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

test("a swipe scrolls the viewport, and the controller scrolls it back", async () => {
  const list = await device.rect("list")
  const x = list.x + list.width / 3
  await device.drag({ x, y: list.y + list.height - 20 }, { x, y: list.y + 20 })
  await device.expectTree((tree) =>
    assert.doesNotMatch(tree.get("list-readout")?.text ?? "", /top 0$/)
  )
  await device.press("to-start")
  await device.expectTree((tree) =>
    assert.equal(tree.get("list-readout")?.text, "List at start, top 0")
  )
})

// The scrollbar is hidden from accessibility, so it's found by the viewport's
// edge: 24 points wide, its thumb at the top.
test("dragging the thumb scrolls to the end", async () => {
  const list = await device.rect("list")
  const x = list.x + list.width - 12
  await device.drag({ x, y: list.y + 12 }, { x, y: list.y + list.height + 60 })
  await device.expectTree((tree) =>
    assert.match(tree.get("list-readout")?.text ?? "", /^List at end, top \d+$/)
  )
})

test("the scroll-to-end button scrolls to the end", async () => {
  await device.pressNamed("Latest")
  await device.expectTree((tree) =>
    assert.match(tree.get("list-readout")?.text ?? "", /^List at end,/)
  )
})

test("a slider drag along the viewport's axis moves the slider, and the viewport stays", async () => {
  const thumb = center(await device.rectNamed("Balance"))
  const control = await device.rect("balance-control")
  await device.drag(thumb, { x: thumb.x - control.width * 0.3, y: thumb.y })
  await expectNear("drag-readout", /^Balance \d+ kept (\d+)/, 20)
  assert.match(await readout("drag-readout"), /scrolled 0;/)
})

test("a slider drag that moves at once leaves the viewport in place", async () => {
  const thumb = center(await device.rectNamed("Balance"))
  const control = await device.rect("balance-control")
  await device.drag(
    thumb,
    { x: thumb.x - control.width * 0.3, y: thumb.y },
    300,
    0
  )
  await expectNear("drag-readout", /^Balance \d+ kept (\d+)/, 20)
  assert.match(await readout("drag-readout"), /scrolled 0;/)
})

test("beside the slider, the same swipe scrolls the viewport", async () => {
  const view = await device.rect("sideways")
  const control = await device.rect("balance-control")
  const y = view.y + view.height / 2
  const start = control.x + control.width + view.width * 0.3
  await device.drag(
    { x: Math.min(start, view.x + view.width - 10), y },
    { x: view.x + 10, y }
  )
  await device.expectTree((tree) => {
    const text = tree.get("drag-readout")?.text ?? ""
    assert.doesNotMatch(text, /scrolled 0;/)
    assert.match(text, /^Balance 50 kept 50,/)
  })
})

test("a vertical slider in a vertical scroll area moves, and the viewport stays", async () => {
  const thumb = center(await device.rectNamed("Level"))
  const control = await device.rect("level-control")
  await device.drag(thumb, { x: thumb.x, y: thumb.y - control.height * 0.3 })
  await expectNear("drag-readout", /level \d+ kept (\d+)/, 80)
  assert.match(await readout("drag-readout"), /lifted 0$/)
})

test("each example opens", async () => {
  const examples = path.join(
    import.meta.dirname,
    "../../examples/components/scroll-area/react-native"
  )
  for (const file of readdirSync(examples)) {
    await device.open(`screen-scroll-area-${file.replace(/\.tsx$/, "")}`)
  }
})
