import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("popover.a11y")

beforeEach(() => device.open("fixture-popover"))

afterEach(async () => {
  for (const name of ["plain", "modal"]) {
    if ((await device.tree()).has(`${name}-content`)) {
      await device.press(`${name}-close`)
      await device.expectTree((tree) =>
        assert.equal(tree.has(`${name}-content`), false)
      )
    }
  }
})

async function open(name: string) {
  await device.press(`${name}-trigger`)
  await device.expectTree((tree) => assert.ok(tree.has(`${name}-content`)))
}

test("the platform tree closed: the trigger is a collapsed button", async () => {
  await device.saveTree("closed")
  const tree = await device.tree()
  assert.deepEqual(tree.get("plain-trigger"), {
    role: "button",
    label: "Open plain",
    enabled: true,
  })
})

test("the platform tree open non-modal: the title is a header and the screen stays reachable", async () => {
  await open("plain")
  await device.saveTree("open-plain")
  const tree = await device.tree()
  const title = [...tree.values()].find((node) => node.text === "Popover plain")
  assert.equal(title?.heading, true)
  assert.equal(tree.has("under"), true)
  if (device.platform === "ios") {
    assert.equal(tree.get("plain-trigger")?.expanded, true)
  }
})

test("the platform tree open modal: the screen behind is hidden on Android", async () => {
  await open("modal")
  await device.saveTree("open-modal")
  const tree = await device.tree()
  assert.deepEqual(tree.get("modal-close"), {
    role: "button",
    label: "Close",
    enabled: true,
  })
  if (device.platform === "android") {
    assert.equal(tree.has("under"), false)
  }
})

test("no audit issues closed", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues open", async () => {
  await open("plain")
  assert.deepEqual(await device.audit(), [])
})
