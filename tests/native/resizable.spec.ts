import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("resizable")

beforeEach(() => device.open("fixture-resizable"))

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

// A drag lands within a few percent of where it was aimed.
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

// Drags the named handle by a share of the panel before it's length.
async function dragHandle(
  label: string,
  panel: string,
  share: number,
  axis: "x" | "y",
  hold?: number
) {
  const handle = center(await device.rectNamed(label))
  const before = await device.rect(panel)
  const length = axis === "x" ? before.width : before.height
  const to = { ...handle, [axis]: handle[axis] + length * share }
  await device.drag(handle, to, ...(hold === undefined ? [] : [300, hold]))
}

// Each panel's width is its share of what the handle leaves.
async function expectShare(share: number) {
  const files = await device.rect("files")
  const code = await device.rect("code")
  const measured = (files.width / (files.width + code.width)) * 100
  assert.ok(Math.abs(measured - share) <= 3, `Files is ${measured}% wide`)
}

test("panels share the group's width by the layout", async () => {
  await expectShare(50)
})

test("a drag moves the handle and commits once when it lifts", async () => {
  await dragHandle("Resize files", "files", 0.4, "x")
  const text = await expectNear("readout", /^Files (\d+)/, 70)
  assert.match(text, /saved \d+ by drag$/)
  await expectShare(Number(/^Files (\d+)/.exec(text)?.[1]))
})

test("inside a scroll view along the same axis that stops scrolling while dragging, a drag moves the handle and the view stays", async () => {
  await dragHandle("Resize left", "left", -0.4, "x")
  await expectNear("scroll-readout", /^Split \d+ kept (\d+)/, 30)
  assert.match(await readout("scroll-readout"), /scrolled 0;/)
})

test("a drag that moves at once still leaves a same-axis scroll view in place", async () => {
  await dragHandle("Resize left", "left", -0.4, "x", 0)
  await expectNear("scroll-readout", /^Split \d+ kept (\d+)/, 30)
  assert.match(await readout("scroll-readout"), /scrolled 0;/)
})

test("beside the handle, the same swipe scrolls the view", async () => {
  const view = await device.rect("sideways")
  const y = view.y + view.height / 2
  await device.drag({ x: view.x + view.width * 0.3, y }, { x: view.x + 10, y })
  await device.expectTree((tree) => {
    const text = tree.get("scroll-readout")?.text ?? ""
    assert.doesNotMatch(text, /scrolled 0;/)
    assert.match(text, /^Split 50 kept 50,/)
  })
})

test("a vertical group in a vertical scroll view that stops scrolling while dragging moves its handle and the view stays", async () => {
  await dragHandle("Resize top", "top", -0.4, "y")
  await expectNear("scroll-readout", /stack \d+ kept (\d+)/, 30)
  assert.match(await readout("scroll-readout"), /lifted 0;/)
})

test("inside a Scroll Area along the same axis, a drag moves the handle with nothing from the app", async () => {
  await dragHandle("Resize inbox", "inbox", -0.4, "x", 0)
  await expectNear("scroll-readout", /area (\d+)/, 30)
  assert.match(await readout("scroll-readout"), /moved 0$/)
})

test("each example opens", async () => {
  const examples = path.join(
    import.meta.dirname,
    "../../examples/components/resizable/react-native"
  )
  for (const file of readdirSync(examples)) {
    await device.open(`screen-resizable-${file.replace(/\.tsx$/, "")}`)
  }
})
