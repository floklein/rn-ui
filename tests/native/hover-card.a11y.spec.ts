import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("hover-card.a11y")

beforeEach(() => device.open("fixture-hover-card"))

afterEach(async () => {
  if ((await device.tree()).has("profile-text")) {
    await device.press("under")
    await device.expectTree((tree) =>
      assert.equal(tree.has("profile-text"), false)
    )
  }
})

async function show() {
  await device.press("show")
  await device.expectTree((tree) => assert.ok(tree.has("profile-text")))
}

// Android gives a link no class of its own, so its role is read on iOS only.
test("the platform tree closed: the trigger stays a plain link", async () => {
  await device.saveTree("closed")
  const tree = await device.tree()
  assert.deepEqual(
    tree.get("profile-trigger"),
    device.platform === "ios"
      ? { role: "link", label: "@hollis", enabled: true }
      : { label: "@hollis", enabled: true }
  )
  assert.equal(tree.has("profile-text"), false)
})

test("the platform tree open: its text is readable and the screen stays reachable", async () => {
  await show()
  await device.saveTree("open")
  const tree = await device.tree()
  assert.equal(tree.get("profile-text")?.text, "Hollis Grant, design engineer.")
  assert.equal(tree.has("under"), true)
  assert.equal(tree.get("profile-trigger")?.label, "@hollis")
})

test("no audit issues closed", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues open", async () => {
  await show()
  assert.deepEqual(await device.audit(), [])
})
