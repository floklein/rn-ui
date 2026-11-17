import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("toolbar.a11y")

const items = [
  "toolbar-bold",
  "toolbar-insert",
  "toolbar-undo",
  "toolbar-track",
  "toolbar-help",
]

// Android gives a link no class of its own, so its role is read on iOS only.
async function snapshot() {
  const tree = await device.tree()
  return Object.fromEntries(
    items.map((id) => {
      const node = tree.get(id)
      if (node && id === "toolbar-help" && device.platform === "android") {
        const { role: _role, ...rest } = node
        return [id, rest]
      }
      return [id, node]
    })
  )
}

const toggleRole = device.platform === "ios" ? "button" : "togglebutton"

const button = (label: string, enabled = true): Node => ({
  role: "button",
  label,
  enabled,
})
const toggle = (label: string, checked = false, enabled = true): Node => ({
  role: toggleRole,
  label,
  enabled,
  checked,
})
const link = (label: string, enabled = true) =>
  device.platform === "ios"
    ? { role: "link", label, enabled }
    : { label, enabled }

beforeEach(() => device.open("fixture-toolbar"))

test("the platform tree: each control is its own element", async () => {
  await device.saveTree("first")
  assert.deepEqual(await snapshot(), {
    "toolbar-bold": toggle("Bold"),
    "toolbar-insert": button("Insert"),
    "toolbar-undo": button("Undo", false),
    "toolbar-track": toggle("Track", false, false),
    "toolbar-help": link("Help"),
  })
  const find = await device.node("toolbar-find")
  assert.equal(find.role, "textbox")
  assert.equal(find.enabled, true)
})

test("the platform tree with the toolbar disabled", async () => {
  await device.press("toolbar-bold")
  await device.press("toolbar-disable")
  await device.expectTree((tree) =>
    assert.equal(tree.get("toolbar-bold")?.enabled, false)
  )
  await device.saveTree("disabled")
  assert.deepEqual(await snapshot(), {
    "toolbar-bold": toggle("Bold", true, false),
    "toolbar-insert": button("Insert", false),
    "toolbar-undo": button("Undo", false),
    "toolbar-track": toggle("Track", false, false),
    "toolbar-help": link("Help", false),
  })
  assert.equal((await device.node("toolbar-find")).enabled, false)
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues with the toolbar disabled", async () => {
  await device.press("toolbar-disable")
  await device.expectTree((tree) =>
    assert.equal(tree.get("toolbar-insert")?.enabled, false)
  )
  assert.deepEqual(await device.audit(), [])
})
