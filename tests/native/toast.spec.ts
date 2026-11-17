import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("toast")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

const expectShown = (id: string, shown: boolean) =>
  device.expectTree((tree) => assert.equal(tree.has(id), shown))

// The toast toast() shows takes no test IDs: find it by its text.
const byText = (text: string) =>
  device.platform === "ios"
    ? `-ios predicate string:type == "XCUIElementTypeStaticText" AND label == "${text}" AND accessible == 1`
    : `android=new UiSelector().text("${text}")`

async function swipeUp(from: {
  x: number
  y: number
  width: number
  height: number
}) {
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 }
  await device.drag(start, { x: start.x, y: start.y - 160 }, 300, 50)
}

beforeEach(() => device.open("fixture-toast"))

// A Modal left open would cover the screen list the next test opens from.
afterEach(async () => {
  if ((await device.tree()).has("profile-content")) {
    await device.press("profile-close")
    await expectShown("profile-content", false)
  }
  await device.press("reset")
})

test("a toast fired over a modal dialog shows above it, and stays when the dialog closes", async () => {
  await device.press("profile-trigger")
  await expectShown("profile-content", true)
  await device.press("profile-fire")
  const title = device.driver.$(byText("Draft saved"))
  await title.waitForDisplayed({ timeout: 5000 })
  await expectShown("profile-content", true)
  await device.screenshot("over-dialog")
  await device.press("profile-close")
  await expectShown("profile-content", false)
  await title.waitForDisplayed({ timeout: 5000 })
})

test("a swipe toward the region's side dismisses the toast with the swipe reason", async () => {
  await device.press("fire-placed")
  await expectShown("placed-toast", true)
  await swipeUp(await device.rect("placed-title"))
  await expectShown("placed-toast", false)
  await expectText("dismissed", "swipe")
})

test("a swipe that starts on the toast's close button dismisses it too", async () => {
  await device.press("fire-placed")
  await expectShown("placed-toast", true)
  await swipeUp(await device.rect("placed-close"))
  await expectShown("placed-toast", false)
  await expectText("dismissed", "swipe")
})

test("a short swipe snaps back, and the action dismisses with the action reason", async () => {
  await device.press("fire-placed")
  const box = await device.rect("placed-title")
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  await device.drag(start, { x: start.x, y: start.y - 20 }, 1200, 100)
  await expectShown("placed-toast", true)
  await expectText("dismissed", "none")
  await device.press("placed-action")
  await expectShown("placed-toast", false)
  await expectText("dismissed", "action")
})
