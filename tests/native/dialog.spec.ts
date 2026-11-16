import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("dialog")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

const expectShown = (id: string, shown: boolean) =>
  device.expectTree((tree) => assert.equal(tree.has(id), shown))

// The fixture's content sits at the bottom, so the top of the screen is backdrop.
async function pressBackdrop() {
  const { width, height } = await device.driver.getWindowSize()
  await device.tapAt(width / 2, height * 0.2)
}

async function open() {
  await device.press("trigger")
  await expectShown("content", true)
}

beforeEach(() => device.open("fixture-dialog"))

// A Modal left open would cover the screen list the next test opens from.
afterEach(async () => {
  const tree = await device.tree()
  if (tree.get("inside-cancel")?.label === "Allow changes") {
    await device.press("inside-cancel")
  }
  for (const [id, close] of [
    ["content", "done"],
    ["controlled-content", "close-from-state"],
  ]) {
    if (tree.has(id)) {
      await device.press(close)
      await expectShown(id, false)
    }
  }
})

test("pressing the trigger opens it from a touch, and opening settles at once", async () => {
  await expectText("changes", "none")
  await open()
  await expectText("inside-changes", "true:trigger-press:touch")
  await expectText("inside-completes", "true")
})

test("a Close part closes it, and the close settles", async () => {
  await open()
  await device.press("done")
  await expectShown("content", false)
  await expectText(
    "changes",
    "true:trigger-press:touch false:close-press:touch"
  )
  await expectText("completes", "true false")
})

test("a press on the backdrop closes it with the outside-press reason", async () => {
  await open()
  await pressBackdrop()
  await expectShown("content", false)
  await expectText(
    "changes",
    "true:trigger-press:touch false:outside-press:touch"
  )
})

test("Android's back closes it with the back reason", async (t) => {
  if (device.platform !== "android") {
    return t.skip("Android only")
  }
  await open()
  await device.back()
  await expectShown("content", false)
  await expectText("changes", "true:trigger-press:touch false:back:touch")
  await expectShown("trigger", true)
})

test("a refused dismissal keeps it open, and the app hears it", async () => {
  await device.press("refuse")
  await open()
  await pressBackdrop()
  await expectText("inside-attempts", "outside-press")
  if (device.platform === "android") {
    await device.back()
    await expectText("inside-attempts", "outside-press back")
  }
  await expectShown("content", true)
  await device.press("done")
  await expectShown("content", false)
})

test("a canceled open stays closed, and a canceled close stays open", async () => {
  await device.press("cancel")
  await device.press("trigger")
  await expectText("changes", "true:trigger-press:touch:canceled")
  await expectShown("content", false)
  await device.press("cancel")
  await open()
  await device.press("inside-cancel")
  await device.press("done")
  await expectText(
    "inside-changes",
    "true:trigger-press:touch:canceled true:trigger-press:touch false:close-press:touch:canceled"
  )
  await expectShown("content", true)
})

test("an async Close action keeps it open while it runs, then closes it", async () => {
  await open()
  await device.press("save")
  await device.expectTree((tree) =>
    assert.equal(tree.get("save")?.label, "Saving")
  )
  await expectShown("content", false)
  await expectText("changes", "true:trigger-press:touch false:action:touch")
})

test("the controller opens it and its open() resolves with how it closed", async () => {
  await device.press("open-from-code")
  await expectShown("content", true)
  await expectText("inside-changes", "true:imperative:programmatic")
  await device.press("done")
  await expectShown("content", false)
  await expectText("result", "close-press:touch:")
})

test("a controlled dialog opens from its trigger and closes from state", async () => {
  await device.press("controlled-trigger")
  await expectShown("controlled-content", true)
  await device.press("close-from-state")
  await expectShown("controlled-content", false)
  await expectShown("controlled-trigger", true)
})

test("removing it while open takes the Modal away and resolves open() with unmount", async () => {
  await device.press("open-from-code")
  await expectShown("content", true)
  await device.press("remove")
  await expectShown("content", false)
  await expectText("result", "unmount:programmatic:")
  await expectShown("trigger", false)
  await device.press("reset")
  await expectText("changes", "none")
})

test("each example opens", async () => {
  for (const component of ["dialog", "alert-dialog"]) {
    const folder = path.join(
      import.meta.dirname,
      `../../examples/components/${component}/react-native`
    )
    for (const file of readdirSync(folder)) {
      await device.open(`screen-${component}-${path.basename(file, ".tsx")}`)
      await device.expectTree((tree) =>
        assert.ok([...tree.values()].some((node) => node.role === "button"))
      )
    }
  }
})
