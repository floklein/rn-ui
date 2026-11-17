import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("drawer.a11y")

beforeEach(() => device.open("fixture-drawer"))

afterEach(async () => {
  const tree = await device.tree()
  for (const [drawer, close] of [
    ["notes", "close-notes"],
    ["places", "close-places"],
  ]) {
    if (tree.has(close)) {
      await device.press(close)
      await device.expectTree((next) => assert.equal(next.has(drawer), false))
    }
  }
})

async function open() {
  await device.press("open-notes")
  await device.expectTree((tree) => assert.ok(tree.has("close-notes")))
}

test("the platform tree closed", async () => {
  await device.saveTree("closed")
  const tree = await device.tree()
  assert.deepEqual(tree.get("open-notes"), {
    role: "button",
    label: "Open Notes",
    enabled: true,
  })
  assert.equal(tree.has("notes"), false)
})

test("the platform tree open: the title is a header, and the screen behind is hidden on Android", async () => {
  await open()
  await device.saveTree("open")
  const tree = await device.tree()
  const title = [...tree.values()].find((node) => node.text === "Release notes")
  assert.equal(title?.heading, true)
  assert.deepEqual(tree.get("close-notes"), {
    role: "button",
    label: "Close Notes",
    enabled: true,
  })
  if (device.platform === "android") {
    assert.equal(tree.has("open-notes"), false)
  }
})

test("the handle is a slider named by its label", async () => {
  await device.press("open-places")
  await device.expectTree((tree) => {
    assert.equal(tree.get("handle")?.role, "slider")
    assert.match(tree.get("handle")?.label ?? "", /^Resize/)
  })
})

test("no audit issues closed", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues open", async () => {
  await open()
  assert.deepEqual(await device.audit(), [])
})
