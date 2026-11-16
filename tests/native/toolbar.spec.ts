import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("toolbar")

const expectLog = (text: string) =>
  device.expectTree((tree) => assert.equal(tree.get("toolbar-log")?.text, text))

beforeEach(() => device.open("fixture-toolbar"))

test("each control in the toolbar is pressed on its own, from a touch", async () => {
  await device.press("toolbar-bold")
  await device.press("toolbar-insert")
  await device.press("toolbar-help")
  await expectLog("bold:true:touch insert help")
})

test("the items of a disabled group ignore a press", async () => {
  for (const id of ["toolbar-undo", "toolbar-track"]) {
    assert.equal((await device.node(id)).enabled, false)
    await device.press(id)
  }
  await device.press("toolbar-insert")
  await expectLog("insert")
})

test("its text field takes typing", async () => {
  await device.press("toolbar-find")
  await device.driver.waitUntil(() => device.driver.isKeyboardShown())
  await device.type("ab")
  await expectLog("find:a find:ab")
})

test("a disabled toolbar disables every item, and its field can't be edited", async () => {
  await device.press("toolbar-disable")
  await device.expectTree((tree) => {
    for (const id of [
      "toolbar-bold",
      "toolbar-insert",
      "toolbar-help",
      "toolbar-find",
    ]) {
      assert.equal(tree.get(id)?.enabled, false, id)
    }
  })
  await device.press("toolbar-bold")
  await device.press("toolbar-insert")
  await device.press("toolbar-find")
  assert.equal(await device.driver.isKeyboardShown(), false)
  await expectLog("none")
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/toolbar/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-toolbar-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok(
        [...tree.values()].some((node) =>
          ["button", "togglebutton", "textbox"].includes(node.role)
        )
      )
    )
  }
})
