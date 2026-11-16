import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("overlays")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

const expectShown = (id: string, shown: boolean) =>
  device.expectTree((tree) => assert.equal(tree.has(id), shown))

async function open(name: string) {
  await device.press(`${name}-trigger`)
  await expectShown(`${name}-content`, true)
}

beforeEach(() => device.open("fixture-overlays"))

// A Modal left open would cover the screen list the next test opens from.
afterEach(async () => {
  for (const name of ["confirm", "sibling", "nested", "profile", "notes", "tips"]) {
    if ((await device.tree()).has(`${name}-content`)) {
      await device.press(`${name}-close`)
      await expectShown(`${name}-content`, false)
    }
  }
})

test("a non-modal dialog shows in the root host, over a screen that stays usable", async () => {
  await open("tips")
  await device.press("under")
  await expectText("presses", "1")
  await expectShown("tips-content", true)
  await device.press("tips-close")
  await expectShown("tips-content", false)
})

test("a press outside a non-modal dialog reaches what is under it, and closes it with the outside-press reason", async () => {
  await open("notes")
  await device.press("notes-body")
  await expectShown("notes-content", true)
  await device.press("under")
  await expectText("presses", "1")
  await expectShown("notes-content", false)
  await expectText("changes", "notes:true:trigger-press notes:false:outside-press")
})

test("a non-modal dialog opened from a modal dialog shows inside its Modal", async () => {
  await open("profile")
  await open("nested")
  await device.press("nested-close")
  await expectShown("nested-content", false)
  await expectShown("profile-content", true)
})

test("a modal dialog opened from a modal dialog shows inside its Modal", async () => {
  await open("profile")
  await open("confirm")
  await device.press("confirm-close")
  await expectShown("confirm-content", false)
  await expectShown("profile-content", true)
})

test("a dialog opened from code while a modal dialog is open shows inside its Modal", async () => {
  await open("profile")
  await device.press("open-sibling")
  await expectShown("sibling-content", true)
  await device.press("sibling-close")
  await expectShown("sibling-content", false)
  await expectShown("profile-content", true)
})

test("Android's back closes the topmost layer in the root host first", async (t) => {
  if (device.platform !== "android") {
    return t.skip("Android only")
  }
  await open("tips")
  await open("notes")
  await device.back()
  await expectShown("notes-content", false)
  await expectShown("tips-content", true)
  await device.back()
  await expectShown("tips-content", false)
  await expectText(
    "changes",
    "tips:true:trigger-press notes:true:trigger-press notes:false:back tips:false:back"
  )
  await expectShown("under", true)
})
