import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("button.a11y")

const buttons = [
  "button-save",
  "button-export",
  "button-sync",
  "button-delete",
  "button-publish",
  "button-share",
]

async function snapshot() {
  const tree = await device.tree()
  return Object.fromEntries(buttons.map((id) => [id, tree.get(id)]))
}

const button = (label: string, enabled = true): Node => ({
  role: "button",
  label,
  enabled,
})

// Android adds the busy state to the label TalkBack reads.
const busy = device.platform === "android" ? "Save, busy" : "Save"

beforeEach(() => device.open("fixture-button"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  assert.deepEqual(await snapshot(), {
    "button-save": button("Save"),
    "button-export": button("Export"),
    "button-sync": button("Sync"),
    "button-delete": button("Delete", false),
    "button-publish": button("Publish", false),
    "button-share": button("Share"),
  })
})

test("the platform tree while actions are pending", async () => {
  await device.press("button-save")
  await device.press("button-export")
  await device.expectTree((tree) =>
    assert.equal(tree.get("save-state")?.text, "pending")
  )
  await device.saveTree("pending")
  assert.deepEqual(await snapshot(), {
    "button-save": button(busy, false),
    "button-export": button("Export", false),
    "button-sync": button("Sync"),
    "button-delete": button("Delete", false),
    "button-publish": button("Publish", false),
    "button-share": button("Share"),
  })
})

test("the platform tree once the actions settle", async () => {
  await device.press("button-save")
  await device.press("button-export")
  await device.expectTree((tree) =>
    assert.equal(tree.get("save-state")?.text, "pending")
  )
  await device.press("finish-waiting")
  await device.expectTree((tree) =>
    assert.equal(tree.get("save-state")?.text, "idle")
  )
  const settled = await snapshot()
  assert.deepEqual(settled["button-save"], button("Save"))
  assert.deepEqual(settled["button-export"], button("Export"))
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues while an action is pending", async () => {
  await device.press("button-save")
  await device.expectTree((tree) =>
    assert.equal(tree.get("save-state")?.text, "pending")
  )
  assert.deepEqual(await device.audit(), [])
})
