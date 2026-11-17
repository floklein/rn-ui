import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("date-picker")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

const expectValue = (text: string) =>
  device.expectTree((tree) =>
    assert.equal(tree.get("input")?.value ?? "", text)
  )

const expectOpen = (open: boolean) =>
  device.expectTree((tree) => assert.equal(tree.has("content"), open))

// The Android keyboard pushes the fixture's readouts off the screen, where
// UiAutomator can't read them.
async function closeKeyboard() {
  if (
    device.platform === "android" &&
    (await device.driver.isKeyboardShown())
  ) {
    await device.driver.hideKeyboard()
  }
}

// XCUITest refuses a key pressed twice in one action.
async function typeKeys(text: string) {
  for (const key of text) {
    await device.type(key)
  }
}

beforeEach(() => device.open("fixture-date-picker"))

test("the input shows the date, and the trigger names it", async () => {
  const tree = await device.tree()
  assert.equal(tree.get("input")?.value, "10/16/2026")
  assert.equal(
    tree.get("trigger")?.label,
    "Choose date, Friday, October 16, 2026"
  )
  assert.equal(tree.get("hint")?.text, "MM/DD/YYYY")
})

test("the trigger opens the calendar under the input, and a day picks a date and closes it", async () => {
  await device.press("trigger")
  await expectOpen(true)
  await expectText("open-readout", "true:trigger-press:touch")
  await expectText("heading", "October 2026")
  const input = await device.rect("input")
  const content = await device.rect("content")
  assert.ok(content.y >= input.y + input.height, "below the input")
  assert.ok(Math.abs(content.x - input.x) <= 2, "lined up with its start")
  await device.pressNamed("Tuesday, October 20, 2026")
  await expectText("value-readout", "2026-10-20:item-press:touch")
  await expectOpen(false)
  await expectValue("10/20/2026")
})

test("a press outside closes it, and reaches what's there", async () => {
  await device.press("trigger")
  await expectOpen(true)
  await device.press("set-christmas")
  await expectOpen(false)
  await expectText("open-readout", "false:outside-press:touch")
  await expectText("value-readout", "2026-12-25:imperative:programmatic")
  await expectValue("12/25/2026")
})

test("an unavailable date can't be picked", async () => {
  await device.press("trigger")
  await expectOpen(true)
  await device.pressNamed("Thursday, October 8, 2026")
  await expectText("value-readout", "none")
  await expectOpen(true)
})

test("Android's back closes it", async () => {
  if (device.platform !== "android") {
    return
  }
  await device.press("trigger")
  await expectOpen(true)
  await device.back()
  await expectOpen(false)
  await expectText("open-readout", "false:back:touch")
})

test("Clear empties it, a typed date is read on submit, and text that isn't one stays", async () => {
  await device.press("clear")
  await expectText("value-readout", "null:clear-press:touch")
  await expectValue("")
  await device.press("input")
  await typeKeys("12/24/2026\n")
  await closeKeyboard()
  await expectText("value-readout", "2026-12-24:input-commit:keyboard")
  await device.press("clear")
  await device.press("input")
  await typeKeys("soon\n")
  await closeKeyboard()
  await expectValue("soon")
  await expectText("value-readout", "null:clear-press:touch")
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/date-picker/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-date-picker-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok(
        [...tree.values()].some(
          (node) => node.role === "button" && /^Choose dates?/.test(node.label)
        )
      )
    )
  }
})
