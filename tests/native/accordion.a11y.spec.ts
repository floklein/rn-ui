import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("accordion.a11y")

beforeEach(() => device.open("fixture-accordion"))

test("the platform tree closed", async () => {
  await device.saveTree("closed")
  const tree = await device.tree()
  assert.deepEqual(tree.get("shipping-trigger"), {
    role: "button",
    label: "Shipping",
    enabled: true,
  })
  assert.equal(tree.has("shipping-text"), false)
})

test("the platform tree open", async () => {
  await device.press("shipping-trigger")
  await device.expectTree((tree) => assert.ok(tree.has("shipping-text")))
  await device.saveTree("open")
  const tree = await device.tree()
  assert.deepEqual(tree.get("shipping-trigger"), {
    role: "button",
    label: "Shipping",
    enabled: true,
    ...(device.platform === "ios" && { expanded: true }),
  })
  assert.deepEqual(tree.get("returns-trigger"), {
    role: "button",
    label: "Returns",
    enabled: true,
  })
  assert.equal(tree.get("shipping-text")?.text, "Ships in two days.")
})

test("no audit issues closed", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues open", async () => {
  await device.press("shipping-trigger")
  await device.expectTree((tree) => assert.ok(tree.has("shipping-text")))
  assert.deepEqual(await device.audit(), [])
})
