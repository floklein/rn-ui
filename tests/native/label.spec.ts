import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("label")

beforeEach(() => device.open("fixture-label"))

test("a press on a switch's label presses it", async () => {
  await device.press("alerts-label")
  await device.expectTree((tree) => {
    assert.equal(tree.get("switch-alerts")?.checked, true)
    assert.equal(tree.get("readout")?.text, "Alerts on, terms not accepted")
  })
})

test("a press on a text field's label starts editing it", async () => {
  await device.press("city-label")
  await device.driver.waitUntil(
    async () => (await device.focused()) === "input-city"
  )
  if (device.platform === "android") {
    await device.driver.hideKeyboard()
  }
})

test("a press on a disabled checkbox's label does nothing until it's enabled", async () => {
  await device.press("terms-label")
  assert.equal(
    (await device.node("readout")).text,
    "Alerts off, terms not accepted"
  )
  await device.press("toggle-disabled")
  await device.press("terms-label")
  await device.expectTree((tree) => {
    assert.equal(tree.get("checkbox-terms")?.checked, true)
    assert.equal(tree.get("readout")?.text, "Alerts off, terms accepted")
  })
})

test("each example opens, its control named by its label", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/label/react-native"
  )
  const names: Record<string, string> = {
    basic: "Shipping city",
    switch: "Email me product updates",
  }
  for (const file of readdirSync(folder)) {
    const example = path.basename(file, ".tsx")
    await device.open(`screen-label-${example}`)
    await device.expectTree((tree) =>
      assert.ok(
        [...tree.values()].some(
          (node) =>
            (node.role === "textbox" || node.role === "switch") &&
            node.label === names[example]
        )
      )
    )
  }
})
