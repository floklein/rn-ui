import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("otp-input")

// The fixture's slots: 40 points wide, 8 apart, from the field's start.
const slotWidth = 40
const slotGap = 8
const slotHeight = 48

// The field takes no test ID of its own, but its keyboard says it's being
// edited.
async function expectFocused() {
  const deadline = Date.now() + 5000
  while (!(await device.driver.isKeyboardShown()) && Date.now() < deadline) {
    await new Promise((done) => setTimeout(done, 250))
  }
  assert.equal(await device.driver.isKeyboardShown(), true)
}

async function expectSlots(drawn: string) {
  await device.expectTree((tree) =>
    assert.equal(tree.get("code-slots")?.text, drawn)
  )
}

// The slots are drawn only, out of the accessibility tree, so a press on one
// lands at its place over the field.
async function pressSlot(index: number) {
  const field = await device.driver.$(
    device.platform === "ios"
      ? "~Code"
      : 'android=new UiSelector().description("Code")'
  )
  const { x, y } = await field.getLocation()
  const scale =
    device.platform === "android"
      ? (
          (await device.driver.execute("mobile: deviceInfo", {})) as {
            displayDensity: number
          }
        ).displayDensity / 160
      : 1
  await device.tapAt(
    x + (slotWidth / 2 + index * (slotWidth + slotGap)) * scale,
    y + (slotHeight / 2) * scale
  )
}

const backspace = ""

beforeEach(() => device.open("fixture-otp-input"))

test("focus() starts editing, and typing fills the slots from the keyboard", async () => {
  await device.press("focus-code")
  await expectFocused()
  await device.type("12")
  await expectSlots("1 2 _* _")
  await device.expectTree((tree) =>
    assert.match(tree.get("changes")?.text ?? "", /value:input-change:keyboard/)
  )
})

test("a press on a slot of the field being edited selects it, and typing replaces that character", async () => {
  await device.press("focus-code")
  await expectFocused()
  await device.type("123")
  await pressSlot(1)
  await expectSlots("1 2* 3 _")
  await device.type("9")
  await expectSlots("1 9 3* _")
})

test("a press on a slot of a field not being edited starts editing with that slot selected", async () => {
  await device.press("fill-code")
  await expectSlots("1 2 3 4")
  await pressSlot(2)
  await expectFocused()
  await expectSlots("1 2 3* 4")
  await device.type("7")
  await expectSlots("1 2 7 4*")
})

test("a deletion leaves the caret where the character was", async () => {
  await device.press("focus-code")
  await expectFocused()
  await device.type("123")
  await pressSlot(1)
  await expectSlots("1 2* 3 _")
  await device.type(backspace)
  await expectSlots("1 3* _ _")
})

test("filling every slot commits the code", async () => {
  await device.press("focus-code")
  await expectFocused()
  await device.type("4321")
  await expectSlots("4 3 2 1*")
  await device.expectTree((tree) =>
    assert.match(tree.get("changes")?.text ?? "", /commit:4321:input-change/)
  )
})

test("characters that don't fit the pattern are refused", async () => {
  await device.press("focus-code")
  await expectFocused()
  await device.type("1a")
  await expectSlots("1 _* _ _")
})

test("a disabled code takes no press", async () => {
  const field = await device.driver.$(
    device.platform === "ios"
      ? "~Disabled code"
      : 'android=new UiSelector().description("Disabled code")'
  )
  await field.click()
  assert.equal(await device.driver.isKeyboardShown(), false)
  await device.expectTree((tree) =>
    assert.equal(tree.get("disabled-slots")?.text, "1 2 _ _")
  )
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/otp-input/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-otp-input-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.role === "textbox"))
    )
  }
})
