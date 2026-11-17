import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("select")

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

beforeEach(() => device.open("fixture-select"))

afterEach(async () => {
  for (const name of ["modal", "plain", "multi", "search"]) {
    if ((await device.tree()).has(`${name}-content`)) {
      await device.press(`${name}-trigger`).catch(() => device.back())
      await expectShown(`${name}-content`, false)
    }
  }
})

test("the list opens 4 points below its trigger, lined up with its start, in its first frame", async () => {
  for (const name of ["modal", "plain"]) {
    const trigger = await open(name)
    const unit = await scale()
    const content = await device.rect(`${name}-content`)
    const gap = content.y - (trigger.y + trigger.height)
    assert.ok(
      Math.abs(gap - 4 * unit) <= 2 * unit,
      `${name}: ${gap} between trigger and list, not ${4 * unit}`
    )
    assert.ok(
      Math.abs(content.x - trigger.x) <= 2 * unit,
      `${name}: the list starts at ${content.x}, the trigger at ${trigger.x}`
    )
    const layouts = (await device.tree()).get(`${name}-layouts`)?.text ?? ""
    assert.equal(
      layouts.split(" ").length,
      1,
      `${name} was laid out at ${layouts}`
    )
    await device.press(`${name}-cherry`)
    await expectShown(`${name}-content`, false)
  }
})

test("pressing an option selects it, closes the list and shows its label", async () => {
  await expectText("modal-value", "Pick a fruit")
  await open("modal")
  await device.press("modal-cherry")
  await expectShown("modal-content", false)
  await expectText("modal-value", "Cherry")
  await expectText(
    "changes",
    "modal:true:trigger-press modal=cherry modal:false:item-press"
  )
})

// Non-modal lists: on Android a Modal hides the changes readout behind it.
test("a disabled option can't be chosen", async () => {
  await open("plain")
  await device.press("plain-banana")
  await expectShown("plain-content", true)
  await expectText("changes", "plain:true:trigger-press")
})

test("with multiple, options toggle and the list stays open", async () => {
  await open("multi")
  await device.press("multi-grape")
  await device.press("multi-apple")
  await device.press("multi-grape")
  await expectShown("multi-content", true)
  await expectText(
    "changes",
    "multi:true:trigger-press multi=grape multi=grape+apple multi=apple"
  )
})

test("a press outside a non-modal list closes it and reaches what is under it", async () => {
  await open("plain")
  await device.press("under")
  await expectShown("plain-content", false)
  await expectText("presses", "1")
  await expectText(
    "changes",
    "plain:true:trigger-press plain:false:outside-press"
  )
})

test("a press outside a modal list only closes it", async () => {
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

test("Android's back closes the list with the back reason", async (t) => {
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

test("typing in the search field filters the options", async () => {
  await open("search")
  await device.driver
    .$(
      device.platform === "ios"
        ? "~search-input"
        : 'android=new UiSelector().resourceId("search-input")'
    )
    .setValue("gr")
  await device.expectTree((tree) => {
    assert.equal(tree.has("search-grape"), true)
    assert.equal(tree.has("search-apple"), false)
  })
  await device.driver
    .$(
      device.platform === "ios"
        ? "~search-input"
        : 'android=new UiSelector().resourceId("search-input")'
    )
    .setValue("kiwi")
  await expectShown("search-empty", true)
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/select/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-select-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) => assert.ok(tree.size > 1))
  }
})
