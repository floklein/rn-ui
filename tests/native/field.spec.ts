import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("field")

beforeEach(() => device.open("fixture-field"))

test("a disabled field set around another disables the controls inside both", async () => {
  await device.expectTree((tree) => {
    assert.equal(tree.get("input-email")?.enabled, false)
    assert.equal(tree.get("switch-alerts")?.enabled, false)
    assert.equal(tree.get("checkbox-digest")?.enabled, false)
    assert.equal(tree.get("toggle-mute")?.enabled, false)
    assert.equal(tree.get("radio-daily")?.enabled, false)
    assert.equal(tree.get("button-test-alert")?.enabled, false)
  })
  await device.press("switch-alerts")
  assert.equal((await device.node("alerts")).text, "off")

  await device.press("toggle-disabled")
  await device.expectTree((tree) => {
    assert.equal(tree.get("input-email")?.enabled, true)
    assert.equal(tree.get("switch-alerts")?.enabled, true)
    assert.equal(tree.get("checkbox-digest")?.enabled, true)
    assert.equal(tree.get("toggle-mute")?.enabled, true)
    assert.equal(tree.get("radio-daily")?.enabled, true)
    assert.equal(tree.get("button-test-alert")?.enabled, true)
  })
  await device.press("switch-alerts")
  await device.expectTree((tree) =>
    assert.equal(tree.get("alerts")?.text, "on")
  )
})

test("the label names its control, and a press on it starts editing", async () => {
  await device.expectTree((tree) =>
    assert.equal(tree.get("input-name")?.label, "Name")
  )
  await device.press("name-label")
  await device.driver.waitUntil(
    async () => (await device.focused()) === "input-name"
  )
  if (device.platform === "android") {
    await device.driver.hideKeyboard()
  }
})

test("an error shows once the field is invalid", async () => {
  assert.equal((await device.tree()).get("name-error"), undefined)
  await device.press("toggle-invalid")
  await device.expectTree((tree) =>
    assert.equal(tree.get("name-error")?.text, "Enter your name.")
  )
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/field/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-field-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.role === "textbox"))
    )
  }
})
