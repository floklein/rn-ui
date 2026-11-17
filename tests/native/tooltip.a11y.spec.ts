import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("tooltip.a11y")

const tip = "Files in the trash still use storage."

beforeEach(() => device.open("fixture-tooltip"))

afterEach(async () => {
  if ((await device.tree()).has("info-text")) {
    await device.press("info-trigger")
    await device.expectTree((tree) =>
      assert.equal(tree.has("info-text"), false)
    )
  }
})

async function open() {
  await device.press("info-trigger")
  await device.expectTree((tree) => assert.ok(tree.has("info-text")))
}

test("the platform tree closed: a tooltip names a trigger with no name of its own, and a named one keeps its own", async () => {
  await device.saveTree("closed")
  const tree = await device.tree()
  assert.deepEqual(tree.get("info-trigger"), {
    role: "button",
    label: tip,
    enabled: true,
  })
  assert.deepEqual(tree.get("plain-trigger"), {
    role: "button",
    label: "Export",
    enabled: true,
  })
  assert.equal(tree.has("info-text"), false)
})

test("the platform tree open: its text is readable and the screen stays reachable", async () => {
  await open()
  await device.saveTree("open")
  const tree = await device.tree()
  assert.equal(tree.get("info-text")?.text, tip)
  assert.equal(tree.has("under"), true)
  assert.equal(tree.get("info-trigger")?.label, tip)
})

test("no audit issues closed", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues open", async () => {
  await open()
  assert.deepEqual(await device.audit(), [])
})
