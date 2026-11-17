import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("date-picker.a11y")

beforeEach(() => device.open("fixture-date-picker"))

afterEach(async () => {
  if ((await device.tree()).has("content")) {
    await device.press("trigger")
    await device.expectTree((tree) => assert.equal(tree.has("content"), false))
  }
})

async function open() {
  await device.press("trigger")
  await device.expectTree((tree) => assert.ok(tree.has("content")))
}

test("the platform tree closed: the trigger is a button named by the date", async () => {
  await device.saveTree("closed")
  const tree = await device.tree()
  assert.deepEqual(tree.get("trigger"), {
    role: "button",
    label: "Choose date, Friday, October 16, 2026",
    enabled: true,
  })
})

test("the platform tree open: days are buttons, the selected one selected, and the screen stays reachable", async () => {
  await open()
  await device.saveTree("open")
  const tree = await device.tree()
  const day = [...tree.values()].find(
    (node) => node.label === "Friday, October 16, 2026"
  )
  assert.equal(day?.role, "button")
  assert.equal(day?.selected, true)
  const unavailable = [...tree.values()].find(
    (node) => node.label === "Thursday, October 8, 2026"
  )
  assert.equal(unavailable?.enabled, false)
  assert.equal(tree.has("under"), true)
})

test("no audit issues closed", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues open", async () => {
  await open()
  assert.deepEqual(await device.audit(), [])
})
