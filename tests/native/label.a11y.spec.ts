import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("label.a11y")

beforeEach(() => device.open("fixture-label"))

test("the platform tree: each control named by its label", async () => {
  await device.saveTree("first")
  await device.expectTree((tree) => {
    assert.equal(tree.get("input-city")?.role, "textbox")
    assert.equal(tree.get("input-city")?.label, "City")
    assert.equal(tree.get("switch-alerts")?.role, "switch")
    assert.equal(tree.get("switch-alerts")?.label, "Weekly alerts")
    assert.equal(tree.get("checkbox-terms")?.role, "checkbox")
    assert.equal(tree.get("checkbox-terms")?.label, "Accept the terms")
    assert.equal(tree.get("checkbox-terms")?.enabled, false)
  })
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})
