import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("date-input")

// iOS reads a segment's accessibility value, which names an empty one.
const empty = device.platform === "ios" ? "Empty" : ""

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

// XCUITest refuses a key repeated within one action.
async function typeKeys(text: string) {
  for (const key of text) {
    await device.type(key)
  }
}

async function expectFocus(id: string) {
  await device.driver.waitUntil(async () => (await device.focused()) === id, {
    timeoutMsg: `focus isn't on ${id}`,
  })
}

async function startEditing() {
  await device.press("focus-start")
  await device.driver.waitUntil(() => device.driver.isKeyboardShown())
  await expectFocus("start-month")
}

beforeEach(() => device.open("fixture-date-input"))

test("typing fills each segment and moves on, then reports the date from the keyboard", async () => {
  await startEditing()
  await typeKeys("11")
  await expectFocus("start-day")
  await typeKeys("4")
  await expectFocus("start-year")
  await typeKeys("2026")
  await closeKeyboard()
  await device.expectTree((tree) => {
    assert.equal(tree.get("start-month")?.value, "11")
    assert.equal(tree.get("start-day")?.value, "04")
    assert.equal(tree.get("start-year")?.value, "2026")
    assert.match(
      tree.get("changes")?.text ?? "",
      /value:2026-11-04:input-change:keyboard/
    )
  })
})

test("Backspace empties a segment, then goes back from an empty one", async () => {
  await startEditing()
  await typeKeys("12")
  await expectFocus("start-day")
  await typeKeys("3")
  await device.type("")
  await device.expectTree((tree) =>
    assert.equal(tree.get("start-day")?.value, empty)
  )
  await device.type("")
  await expectFocus("start-month")
})

test("a letter in a number segment is written back at once", async () => {
  await startEditing()
  const month = device.driver.$(
    device.platform === "ios"
      ? "~start-month"
      : 'android=new UiSelector().resourceId("start-month")'
  )
  await month.addValue("x")
  await closeKeyboard()
  await device.expectTree((tree) => {
    assert.equal(tree.get("start-month")?.value, empty)
    assert.equal(tree.get("changes")?.text, "none")
  })
})

test("a time takes AM or PM from a letter", async () => {
  await device.press("time-hour")
  await device.driver.waitUntil(() => device.driver.isKeyboardShown())
  await typeKeys("2")
  await expectFocus("time-minute")
  await typeKeys("30")
  await expectFocus("time-dayPeriod")
  await typeKeys("p")
  await closeKeyboard()
  await device.expectTree((tree) => {
    assert.equal(tree.get("time-dayPeriod")?.value, "PM")
    assert.match(
      tree.get("changes")?.text ?? "",
      /value:14:30:input-change:keyboard/
    )
  })
})

test("a controller sets the date", async () => {
  await device.press("set-start")
  await device.expectTree((tree) => {
    assert.equal(tree.get("start-month")?.value, "12")
    assert.equal(tree.get("start-day")?.value, "25")
    assert.equal(tree.get("start-year")?.value, "2026")
  })
})

test("a disabled date input can't be edited", async () => {
  const tree = await device.tree()
  for (const type of ["month", "day", "year"]) {
    assert.equal(tree.get(`locked-${type}`)?.enabled, false)
  }
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/date-input/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-date-input-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok(
        [...tree.values()].some((node) =>
          ["textbox", "slider", "spinbutton"].includes(node.role)
        )
      )
    )
  }
})
