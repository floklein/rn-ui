import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("collapsible.a11y")

beforeEach(() => device.open("fixture-collapsible"))

test("the platform tree closed", async () => {
  await device.saveTree("closed")
  const tree = await device.tree()
  assert.deepEqual(tree.get("trigger"), {
    role: "button",
    label: "Order #4189",
    enabled: true,
  })
  assert.equal(tree.has("panel-text"), false)
})

test("the platform tree open", async () => {
  await device.press("trigger")
  await device.expectTree((tree) => assert.ok(tree.has("panel-text")))
  await device.saveTree("open")
  const tree = await device.tree()
  assert.deepEqual(tree.get("trigger"), {
    role: "button",
    label: "Order #4189",
    enabled: true,
  })
  assert.equal(tree.get("panel-text")?.text, "Linen shirt")
})

test("no audit issues closed", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues open", async () => {
  await device.press("trigger")
  await device.expectTree((tree) => assert.ok(tree.has("panel-text")))
  assert.deepEqual(await device.audit(), [])
})
