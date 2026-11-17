import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("popover")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

const expectShown = (id: string, shown: boolean) =>
  device.expectTree((tree) => assert.equal(tree.has(id), shown))

let density: number | undefined
async function scale() {
  if (device.platform === "ios") {
    return 1
  }
  density ??= (
    (await device.driver.execute("mobile: deviceInfo", {})) as {
      displayDensity: number
    }
  ).displayDensity
  return density / 160
}

// Measured before opening: on Android a Modal hides the screen behind it.
async function open(name: string) {
  const trigger = await device.rect(`${name}-trigger`)
  await device.press(`${name}-trigger`)
  await expectShown(`${name}-content`, true)
  return trigger
}

// The content sits 8 points below its trigger, across its center, and was
// never laid out anywhere else while open.
async function expectBeside(
  name: string,
  trigger: Awaited<ReturnType<typeof device.rect>>
) {
  const unit = await scale()
  const content = await device.rect(`${name}-content`)
  const gap = content.y - (trigger.y + trigger.height)
  assert.ok(
    Math.abs(gap - 8 * unit) <= 2 * unit,
    `${name}: ${gap} between trigger and content, not ${8 * unit}`
  )
  const center = trigger.x + trigger.width / 2
  assert.ok(
    content.x <= center && center <= content.x + content.width,
    `${name}: content from ${content.x} to ${content.x + content.width} isn't across the trigger's center ${center}`
  )
  await expectText(`${name}-side`, "bottom")
  const layouts = (await device.tree()).get(`${name}-layouts`)?.text ?? ""
  assert.equal(
    layouts.split(" ").length,
    1,
    `${name} was laid out at ${layouts}`
  )
}

beforeEach(() => device.open("fixture-popover"))

afterEach(async () => {
  for (const name of ["inner", "scrolling", "modal", "plain"]) {
    if ((await device.tree()).has(`${name}-content`)) {
      await device.press(`${name}-close`)
      await expectShown(`${name}-content`, false)
    }
  }
  if ((await device.tree()).has("app-modal-close")) {
    await device.press("app-modal-close")
    await expectShown("app-modal-close", false)
  }
})

test("a non-modal popover opens beside its trigger in the root host, in its first frame", async () => {
  await expectBeside("plain", await open("plain"))
  await expectText("changes", "plain:true:trigger-press")
})

test("a press outside a non-modal popover closes it and reaches what is under it", async () => {
  await open("plain")
  await device.press("under")
  await expectShown("plain-content", false)
  await expectText("presses", "1")
  await expectText(
    "changes",
    "plain:true:trigger-press plain:false:outside-press"
  )
})

test("a modal popover in its Modal is placed against its trigger outside it", async () => {
  await expectBeside("modal", await open("modal"))
})

test("a press outside a modal popover only closes it", async () => {
  await open("modal")
  const { width, height } = await device.driver.getWindowSize()
  await device.tapAt(width / 2, height * 0.9)
  await expectShown("modal-content", false)
  await expectText(
    "changes",
    "modal:true:trigger-press modal:false:outside-press"
  )
  await expectText("presses", "0")
})

test("Android's back closes a popover with the back reason", async (t) => {
  if (device.platform !== "android") {
    return t.skip("Android only")
  }
  for (const name of ["plain", "modal"]) {
    await open(name)
    await device.back()
    await expectShown(`${name}-content`, false)
  }
  await expectText(
    "changes",
    "plain:true:trigger-press plain:false:back modal:true:trigger-press modal:false:back"
  )
})

for (const kind of ["translucent", "opaque"]) {
  test(`inside an app's Modal whose status bar is ${kind}, it opens beside its trigger`, async () => {
    await device.press(`app-modal-${kind}`)
    await expectShown("app-modal-close", true)
    await expectBeside("inner", await open("inner"))
  })
}

test("it follows its trigger while a scroll view scrolls it", async () => {
  await expectBeside("scrolling", await open("scrolling"))
  const before = await device.rect("scrolling-trigger")
  const box = await device.rect("scroller")
  const x = box.x + box.width * 0.85
  await device.drag(
    { x, y: box.y + box.height * 0.8 },
    { x, y: box.y + box.height * 0.5 },
    800,
    0
  )
  const after = await device.rect("scrolling-trigger")
  assert.ok(after.y < before.y, "the scroll view didn't scroll")
  await expectShown("scrolling-content", true)
  const unit = await scale()
  const content = await device.rect("scrolling-content")
  assert.ok(
    Math.abs(content.y - (after.y + after.height) - 8 * unit) <= 2 * unit,
    `the content at ${content.y} didn't follow the trigger to ${after.y + after.height}`
  )
})
