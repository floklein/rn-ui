import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("hover-card")

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

async function show() {
  await device.press("show")
  await expectShown("profile-text", true)
}

beforeEach(() => device.open("fixture-hover-card"))

afterEach(async () => {
  if ((await device.tree()).has("profile-text")) {
    await device.press("under")
    await expectShown("profile-text", false)
  }
})

test("a tap follows the link and a long press opens nothing", async () => {
  await device.press("profile-trigger")
  await expectText("follows", "1")
  const box = await device.rect("profile-trigger")
  await device.tapAt(box.x + box.width / 2, box.y + box.height / 2, 1200)
  await expectText("changes", "none")
  assert.equal((await device.tree()).has("profile-content"), false)
})

test("opened from code, it sits below its link in its first frame", async () => {
  const trigger = await device.rect("profile-trigger")
  await show()
  await expectText("profile-side", "bottom")
  const unit = await scale()
  const content = await device.rect("profile-content")
  const gap = content.y - (trigger.y + trigger.height)
  assert.ok(
    Math.abs(gap - 8 * unit) <= 2 * unit,
    `${gap} between link and card, not ${8 * unit}`
  )
  const center = trigger.x + trigger.width / 2
  assert.ok(
    content.x <= center && center <= content.x + content.width,
    `card from ${content.x} to ${content.x + content.width} isn't across the link's center ${center}`
  )
})

test("a press outside closes it and reaches what is under it", async () => {
  await show()
  await device.press("under")
  await expectShown("profile-text", false)
  await expectText("presses", "1")
  await expectText("changes", "false:outside-press")
})

test("Android's back closes it with the back reason", async (t) => {
  if (device.platform !== "android") {
    return t.skip("Android only")
  }
  await show()
  await device.back()
  await expectShown("profile-text", false)
  await expectText("changes", "false:back")
})
