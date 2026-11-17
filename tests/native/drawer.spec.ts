import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("drawer")

beforeEach(() => device.open("fixture-drawer"))

afterEach(async () => {
  const tree = await device.tree()
  for (const [drawer, close] of [
    ["notes", "close-notes"],
    ["places", "close-places"],
  ]) {
    if (tree.has(close)) {
      await device.press(close)
      await device.expectTree((next) => assert.equal(next.has(drawer), false))
    }
  }
})

const pause = (ms: number) => new Promise((done) => setTimeout(done, ms))

// Points on iOS; Android's driver measures in pixels, so distances scale.
let scale: number | undefined
beforeEach(async () => {
  scale ??=
    device.platform === "android"
      ? (
          (await device.driver.execute("mobile: deviceInfo", {})) as {
            displayDensity: number
          }
        ).displayDensity / 160
      : 1
})
const points = (distance: number) => distance * scale!

async function screenHeight() {
  return (await device.driver.getWindowSize()).height
}

async function text(id: string) {
  return (await device.node(id)).text ?? (await device.node(id)).label
}

async function expectText(id: string, pattern: RegExp) {
  await device.expectTree((tree) => {
    const node = tree.get(id)
    assert.match(node?.text ?? node?.label ?? "", pattern)
  })
}

// A drawer at rest: its top where a snap point puts it, to a couple of
// points, once the settle has landed.
async function expectTop(id: string, top: number) {
  const tolerance = device.platform === "android" ? 6 : 2
  const deadline = Date.now() + 5000
  for (;;) {
    const { y } = await device.rect(id)
    if (Math.abs(y - top) <= tolerance) {
      return
    }
    assert.ok(Date.now() < deadline, `${id} rests at ${y}, not ${top}`)
    await pause(250)
  }
}

async function openNotes() {
  await device.press("open-notes")
  await expectText("notes-state", /^open by trigger-press/)
  const height = await screenHeight()
  const sheet = await device.rect("notes")
  await expectTop("notes", height - sheet.height)
}

test("a press opens the drawer, which rises from the bottom and rests at its own size", async () => {
  await openNotes()
})

test("dragging the drawer toward its edge dismisses it with the swipe reason", async () => {
  await openNotes()
  const title = await device.rect("notes-title")
  const x = title.x + 40
  const y = title.y + title.height / 2
  await device.drag({ x, y }, { x, y: y + points(450) }, 300, 50)
  await expectText("notes-readout", /^closed by swipe$/)
})

test("over the list at its top, pushing up scrolls the list and the drawer stays", async () => {
  await openNotes()
  const before = await device.rect("notes")
  const list = await device.rect("notes-list")
  const x = list.x + list.width / 2
  const y = list.y + list.height / 2
  await device.drag({ x, y: y + points(100) }, { x, y: y - points(100) })
  await expectText("notes-state", /scrolled down$/)
  await pause(800)
  assert.equal((await device.rect("notes")).y, before.y)
  await expectText("notes-state", /^open by trigger-press/)
})

test("over the list scrolled down, pulling down scrolls it back, and at its top the same pull moves the drawer", async () => {
  await openNotes()
  const list = await device.rect("notes-list")
  const x = list.x + list.width / 2
  const y = list.y + list.height / 2
  await device.drag({ x, y: y + points(100) }, { x, y: y - points(100) })
  await expectText("notes-state", /scrolled down$/)
  await pause(800)
  // The push flings the content on, so pulling back can take more than one pull.
  for (let pull = 0; pull < 3; pull++) {
    await device.drag({ x, y: y - points(150) }, { x, y: y + points(150) })
    await pause(800)
    if (/scrolled to the top$/.test(await text("notes-state"))) {
      break
    }
  }
  await expectText("notes-state", /scrolled to the top$/)
  await expectText("notes-state", /^open by trigger-press/)
  await pause(800)
  await device.drag(
    { x, y: y - points(150) },
    { x, y: y + points(250) },
    300,
    50
  )
  await expectText("notes-readout", /^closed by swipe$/)
})

test("the settle lands on each snap point the handle and a release pick", async () => {
  const height = await screenHeight()
  await device.press("open-places")
  await expectText("places-state", /^open by trigger-press$/)
  await expectTop("places", height * 0.6)
  await device.press("handle")
  await expectText("places-state", /^at 0\.8 by handle-press$/)
  await expectTop("places", height * 0.2)
  const handle = await device.rect("handle")
  const x = handle.x + handle.width / 2
  const y = handle.y + handle.height / 2
  await device.drag({ x, y }, { x, y: y + points(250) }, 300, 50)
  await expectText("places-state", /^at 0\.4 by swipe$/)
  await expectTop("places", height * 0.6)
})

test("each example opens", async () => {
  const examples = path.join(
    import.meta.dirname,
    "../../examples/components/drawer/react-native"
  )
  for (const file of readdirSync(examples)) {
    await device.open(`screen-drawer-${file.replace(/\.tsx$/, "")}`)
  }
})
