import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("autocomplete.a11y")

beforeEach(() => device.open("fixture-autocomplete"))

afterEach(async () => {
  if ((await device.tree()).has("content")) {
    await device.press("under")
    await device.expectTree((tree) => assert.equal(tree.has("content"), false))
  }
})

async function open() {
  await device.press("trigger")
  await device.expectTree((tree) => assert.ok(tree.has("content")))
}

test("the platform tree closed: the field is a text field named by its label", async () => {
  await device.saveTree("closed")
  const field = await device.node("input")
  assert.equal(field.role, "textbox")
  assert.equal(
    device.platform === "ios" ? field.label : field.label.split(", ")[0],
    "Fruit"
  )
  assert.equal(field.enabled, true)
})

test("the platform tree open: each suggestion is a button, a disabled one disabled", async () => {
  await open()
  await device.saveTree("open")
  const tree = await device.tree()
  assert.equal(tree.get("item-apple")?.role, "button")
  assert.equal(tree.get("item-apple")?.label, "Apple")
  assert.equal(tree.get("item-cherry")?.label, "Cherry")
  if (device.platform === "android") {
    assert.equal(tree.get("item-banana")?.enabled, false)
  }
  assert.equal(tree.has("under"), true)
})

test("no audit issues closed", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues open", async () => {
  await open()
  assert.deepEqual(await device.audit(), [])
})
