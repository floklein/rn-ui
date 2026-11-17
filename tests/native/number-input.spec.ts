import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("number-input")

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

// Text sent to the field itself, past the keyboard, which on Android would
// filter a letter out of a number pad before the field sees it.
async function insert(text: string) {
  const field = device.driver.$(
    device.platform === "ios"
      ? "~amount-control"
      : 'android=new UiSelector().resourceId("amount-control")'
  )
  await field.addValue(text)
}

async function startEditing() {
  await device.press("focus-amount")
  await device.driver.waitUntil(() => device.driver.isKeyboardShown())
}

beforeEach(() => device.open("fixture-number-input"))

test("typing a number reaches the value from the keyboard", async () => {
  await startEditing()
  await device.type("42")
  await closeKeyboard()
  await device.expectTree((tree) => {
    assert.equal(tree.get("amount-control")?.value, "42")
    assert.match(
      tree.get("changes")?.text ?? "",
      /value:42:input-change:keyboard/
    )
  })
})

test("a letter is written back at once, and the caret stays where it was", async () => {
  await startEditing()
  await device.type("42")
  await insert("x")
  await device.type("1")
  await closeKeyboard()
  await device.expectTree((tree) => {
    assert.equal(tree.get("amount-control")?.value, "421")
    assert.doesNotMatch(tree.get("changes")?.text ?? "", /x/)
  })
})

test("Enter commits what's typed, clamped and formatted", async () => {
  await startEditing()
  await device.type("12345\n")
  await closeKeyboard()
  await device.expectTree((tree) => {
    assert.equal(tree.get("amount-control")?.value, "1,000")
    assert.match(tree.get("changes")?.text ?? "", /commit:1000:input-commit/)
  })
})

test("a tap on a step button steps once and commits", async () => {
  await device.press("amount-increment")
  await device.expectTree((tree) => {
    assert.equal(tree.get("amount-control")?.value, "1")
    assert.match(
      tree.get("changes")?.text ?? "",
      /value:1:increment-press:touch commit:1:increment-press/
    )
  })
})

test("holding a step button repeats until it lifts", async () => {
  const box = await device.rect("amount-decrement")
  await device.tapAt(box.x + box.width / 2, box.y + box.height / 2, 1500)
  await device.expectTree((tree) => {
    const value = Number(tree.get("amount-control")?.value)
    assert.ok(value <= -5, `stepped to ${value}`)
    assert.match(tree.get("changes")?.text ?? "", /commit:-\d+:decrement-press/)
  })
})

test("a drag across the scrub area steps the value, and commits once on lift", async () => {
  const box = await device.rect("amount-scrub")
  const y = box.y + box.height / 2
  await device.drag({ x: box.x + 10, y }, { x: box.x + 90, y })
  await device.expectTree((tree) => {
    assert.ok(Number(tree.get("amount-control")?.value) > 0)
    assert.match(tree.get("changes")?.text ?? "", /commit:\d+:scrub/)
  })
})

test("a disabled number input can't be edited or stepped", async () => {
  const tree = await device.tree()
  assert.equal(tree.get("locked-control")?.enabled, false)
  assert.equal(tree.get("locked-increment")?.enabled, false)
  assert.equal(tree.get("locked-decrement")?.enabled, false)
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/number-input/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-number-input-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.role === "textbox"))
    )
  }
})
