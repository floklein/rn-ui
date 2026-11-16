import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("toggle.a11y")

const toggles = [
  "toggle-bookmark",
  "toggle-pin",
  "toggle-bold",
  "toggle-italic",
  "toggle-underline",
  "toggle-start",
  "toggle-center",
  "toggle-end",
]

async function snapshot() {
  const tree = await device.tree()
  return Object.fromEntries(toggles.map((id) => [id, tree.get(id)]))
}

const toggle = (label: string, checked = false, enabled = true): Node => ({
  role: device.platform === "ios" ? "button" : "togglebutton",
  label,
  enabled,
  checked,
})

beforeEach(() => device.open("fixture-toggle"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  assert.deepEqual(await snapshot(), {
    "toggle-bookmark": toggle("Bookmark"),
    "toggle-pin": toggle("Pin", false, false),
    "toggle-bold": toggle("Bold"),
    "toggle-italic": toggle("Italic"),
    "toggle-underline": toggle("Underline"),
    "toggle-start": toggle("Start", true),
    "toggle-center": toggle("Center"),
    "toggle-end": toggle("End"),
  })
})

test("the platform tree after toggles are pressed", async () => {
  await device.press("toggle-bookmark")
  await device.press("toggle-bold")
  await device.press("toggle-end")
  await device.expectTree((tree) =>
    assert.equal(tree.get("toggle-end")?.checked, true)
  )
  await device.saveTree("pressed")
  assert.deepEqual(await snapshot(), {
    "toggle-bookmark": toggle("Bookmark", true),
    "toggle-pin": toggle("Pin", false, false),
    "toggle-bold": toggle("Bold", true),
    "toggle-italic": toggle("Italic"),
    "toggle-underline": toggle("Underline"),
    "toggle-start": toggle("Start"),
    "toggle-center": toggle("Center"),
    "toggle-end": toggle("End", true),
  })
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues with toggles pressed", async () => {
  await device.press("toggle-bookmark")
  await device.press("toggle-bold")
  await device.expectTree((tree) =>
    assert.equal(tree.get("toggle-bold")?.checked, true)
  )
  assert.deepEqual(await device.audit(), [])
})
