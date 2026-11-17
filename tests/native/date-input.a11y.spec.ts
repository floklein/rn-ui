import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("date-input.a11y")

beforeEach(() => device.open("fixture-date-input"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  const tree = await device.tree()
  for (const [id, label] of [
    ["start-month", "month"],
    ["start-day", "day"],
    ["start-year", "year"],
    ["time-hour", "hour"],
    ["time-minute", "minute"],
    ["time-dayPeriod", "AM/PM"],
  ]) {
    assert.equal(tree.get(id)?.label, label, id)
    assert.equal(tree.get(id)?.enabled, true, id)
  }
  assert.equal(tree.get("locked-day")?.enabled, false)
  assert.ok(
    ![...tree.values()].some((node) => node.text === "/"),
    "the text between segments is hidden"
  )
})

test("the platform tree once a controller sets the value", async () => {
  await device.press("set-start")
  await device.expectTree((tree) =>
    assert.equal(tree.get("start-day")?.value, "25")
  )
  await device.saveTree("set")
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})
