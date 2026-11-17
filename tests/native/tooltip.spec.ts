import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("tooltip")

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

async function holdOn(id: string, hold: number) {
  const box = await device.rect(id)
  await device.tapAt(box.x + box.width / 2, box.y + box.height / 2, hold)
}

beforeEach(() => device.open("fixture-tooltip"))

afterEach(async () => {
  if ((await device.tree()).has("info-text")) {
    await device.press("info-trigger")
    await expectShown("info-text", false)
  }
})

test("a tap and a long press leave a tooltip closed", async () => {
  await device.press("plain-trigger")
  await holdOn("plain-trigger", 1200)
  await expectText("changes", "none")
  assert.equal((await device.tree()).has("plain-content"), false)
})

test("a press opens a toggleable tooltip above its trigger in its first frame, and the next closes it", async () => {
  const trigger = await device.rect("info-trigger")
  await device.press("info-trigger")
  await expectShown("info-text", true)
  await expectText("info-side", "top")
  const unit = await scale()
  const content = await device.rect("info-content")
  const gap = trigger.y - (content.y + content.height)
  assert.ok(
    Math.abs(gap - 8 * unit) <= 2 * unit,
    `${gap} between content and trigger, not ${8 * unit}`
  )
  const center = trigger.x + trigger.width / 2
  assert.ok(
    content.x <= center && center <= content.x + content.width,
    `content from ${content.x} to ${content.x + content.width} isn't across the trigger's center ${center}`
  )
  const layouts = (await device.tree()).get("layouts")?.text ?? ""
  assert.equal(layouts.split(" ").length, 1, `laid out at ${layouts}`)
  await device.press("info-trigger")
  await expectShown("info-text", false)
  await expectText(
    "changes",
    "info:true:trigger-press info:false:trigger-press"
  )
})

test("a press outside closes it and reaches what is under it", async () => {
  await device.press("info-trigger")
  await expectShown("info-text", true)
  await device.press("under")
  await expectShown("info-text", false)
  await expectText("presses", "1")
  await expectText(
    "changes",
    "info:true:trigger-press info:false:outside-press"
  )
})

test("Android's back closes it with the back reason", async (t) => {
  if (device.platform !== "android") {
    return t.skip("Android only")
  }
  await device.press("info-trigger")
  await expectShown("info-text", true)
  await device.back()
  await expectShown("info-text", false)
  await expectText("changes", "info:true:trigger-press info:false:back")
})
