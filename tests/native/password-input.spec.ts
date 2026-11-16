import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("password-input")

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
  if (
    device.platform === "android" &&
    (await device.driver.isKeyboardShown())
  ) {
    await device.driver.hideKeyboard()
  }
}

beforeEach(() => device.open("fixture-password-input"))

test("focus() starts editing the hidden field, and typing reaches it", async () => {
  await device.press("focus-password")
  await expectFocused("password-control")
  await device.type("hunter2")
  await closeKeyboard()
  await device.expectTree((tree) => {
    assert.equal(tree.get("password-control")?.secure, true)
    assert.match(tree.get("changes")?.text ?? "", /value:input-change:keyboard/)
  })
})

test("the toggle shows the password and hides it again, reporting toggle-press from a touch", async () => {
  await device.press("focus-password")
  await expectFocused("password-control")
  await device.type("hunter2")
  await closeKeyboard()
  await device.press("password-toggle")
  await device.expectTree((tree) => {
    assert.equal(tree.get("password-control")?.secure, undefined)
    assert.equal(tree.get("password-control")?.value, "hunter2")
    assert.equal(tree.get("password-toggle")?.checked, true)
    assert.match(tree.get("changes")?.text ?? "", /shown:toggle-press:touch/)
  })
  await device.press("password-toggle")
  await device.expectTree((tree) => {
    assert.equal(tree.get("password-control")?.secure, true)
    assert.equal(tree.get("password-toggle")?.checked, false)
  })
})

test("a press on the toggle while editing keeps editing, and typing goes on after the text", async () => {
  await device.press("focus-password")
  await expectFocused("password-control")
  await device.type("abc")
  await device.press("password-toggle")
  await expectFocused("password-control")
  await device.type("def")
  await closeKeyboard()
  await device.expectTree((tree) =>
    assert.equal(tree.get("password-control")?.value, "abcdef")
  )
})

test("a press on the root's own text starts editing the field", async () => {
  await device.press("password-affix")
  await expectFocused("password-control")
})

test("a read-only field can't be edited but shows its password; a disabled one does neither", async () => {
  await device.press("toggle-readonly")
  await device.expectTree((tree) => {
    assert.equal(tree.get("password-readonly")?.value, "7Hq2-vX9p")
    assert.equal(tree.get("toggle-readonly")?.checked, true)
    assert.equal(tree.get("password-disabled")?.enabled, false)
    assert.equal(tree.get("toggle-disabled")?.enabled, false)
  })
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/password-input/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-password-input-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.role === "textbox"))
    )
  }
})
