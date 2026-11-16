import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("field.a11y")

beforeEach(() => device.open("fixture-field"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  const tree = await device.tree()
  assert.deepEqual(tree.get("input-name"), {
    role: "textbox",
    label: "Name",
    enabled: true,
    value: "",
  })
  assert.deepEqual(tree.get("input-email"), {
    role: "textbox",
    label: "Email",
    enabled: false,
    value: "",
  })
  assert.equal(tree.get("switch-alerts")?.label, "Weekly alerts")
  assert.equal(tree.get("switch-alerts")?.enabled, false)
})

test("the platform tree once enabled and invalid", async () => {
  await device.press("toggle-disabled")
  await device.press("toggle-invalid")
  await device.expectTree((tree) => {
    assert.equal(tree.get("input-email")?.enabled, true)
    assert.equal(tree.get("name-error")?.text, "Enter your name.")
  })
  await device.saveTree("invalid")
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})
