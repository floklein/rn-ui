import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("dialog.a11y")

beforeEach(() => device.open("fixture-dialog"))

async function open() {
  await device.press("trigger")
  await device.expectTree((tree) => assert.ok(tree.has("content")))
}

test("the platform tree closed", async () => {
  await device.saveTree("closed")
  const tree = await device.tree()
  assert.deepEqual(tree.get("trigger"), {
    role: "button",
    label: "Edit profile",
    enabled: true,
  })
  assert.equal(tree.has("content"), false)
})

test("the platform tree open: the title is a header, and the screen behind is hidden on Android", async () => {
  await open()
  await device.saveTree("open")
  const tree = await device.tree()
  const title = [...tree.values()].find((node) => node.text === "Profile")
  assert.equal(title?.heading, true)
  assert.deepEqual(tree.get("done"), {
    role: "button",
    label: "Done",
    enabled: true,
  })
  if (device.platform === "android") {
    assert.equal(tree.has("trigger"), false)
    assert.equal(tree.has("changes"), false)
  }
})

test("no audit issues closed", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues open", async () => {
  await open()
  assert.deepEqual(await device.audit(), [])
})
