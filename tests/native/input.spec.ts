import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("input")

const values = async () =>
  JSON.parse((await device.node("values")).text ?? "{}") as Record<
    string,
    string
  >

async function expectFocused(id: string) {
  const deadline = Date.now() + 5000
  while ((await device.focused()) !== id && Date.now() < deadline) {
    await new Promise((done) => setTimeout(done, 250))
  }
  assert.equal(await device.focused(), id)
}

// The Android keyboard pushes the fixture's readouts off the screen, where
// UiAutomator can't read them.
async function closeKeyboard() {
  if (await device.driver.isKeyboardShown()) {
    await device.driver.hideKeyboard()
  }
}

beforeEach(() => device.open("fixture-input"))

test("focus() starts editing the input, and typing reaches it", async () => {
  await device.press("focus-email")
  await expectFocused("input-email")
  await device.type("hi")
  await closeKeyboard()
  await device.expectTree((tree) => {
    assert.equal(tree.get("input-email")?.value, "hi")
    assert.match(tree.get("changes")?.text ?? "", /email:input-change:keyboard/)
  })
  assert.equal((await values()).email, "hi")
})

test("focus() starts editing the textarea, where Enter adds a line", async () => {
  await device.press("focus-notes")
  // XCUITest reports no active element for a text view, so typing proves it.
  await device.driver.waitUntil(() => device.driver.isKeyboardShown())
  await device.type("a\nb")
  await closeKeyboard()
  await device.expectTree((tree) =>
    assert.match(tree.get("changes")?.text ?? "", /notes:input-change/)
  )
  assert.equal((await values()).notes, "a\nb")
})

test("a group's Clear empties its field with clear-press, and editing starts", async () => {
  await device.press("clear-search")
  await expectFocused("input-search")
  await closeKeyboard()
  await device.expectTree((tree) => {
    assert.equal(tree.get("changes")?.text, "search:clear-press:touch")
    assert.equal(tree.get("clear-search"), undefined)
  })
  assert.equal((await values()).search, "")
})

test("a press on a group's text starts editing its field", async () => {
  await device.press("search-affix")
  await expectFocused("input-search")
})

test("a disabled input can't be edited", async () => {
  assert.equal((await device.node("input-disabled")).enabled, false)
})

test("each example opens", async () => {
  for (const component of ["input", "textarea"]) {
    const folder = path.join(
      import.meta.dirname,
      `../../examples/components/${component}/react-native`
    )
    for (const file of readdirSync(folder)) {
      await device.open(`screen-${component}-${path.basename(file, ".tsx")}`)
      await device.expectTree((tree) =>
        assert.ok([...tree.values()].some((node) => node.role === "textbox"))
      )
    }
  }
})
