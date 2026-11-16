import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("tabs.a11y")

const tabs = ["tab-profile", "tab-billing", "tab-team"]

async function snapshot() {
  const tree = await device.tree()
  return Object.fromEntries(tabs.map((id) => [id, tree.get(id)]))
}

// React Native gives iOS no tab trait, and an Android tab its role only as a
// description: the tree shows a plain element with its selected state.
const tab = (label: string, selected = false, enabled = true): Node => ({
  role: device.platform === "ios" ? "group" : "android.view.View",
  label,
  enabled,
  ...(selected && { selected: true }),
})

beforeEach(() => device.open("fixture-tabs"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  assert.deepEqual(await snapshot(), {
    "tab-profile": tab("Profile", true),
    "tab-billing": tab("Billing"),
    "tab-team": tab("Team", false, false),
  })
})

test("the platform tree after a tab is pressed", async () => {
  await device.press("tab-billing")
  await device.expectTree((tree) =>
    assert.equal(tree.get("tab-billing")?.selected, true)
  )
  await device.saveTree("billing")
  assert.deepEqual(await snapshot(), {
    "tab-profile": tab("Profile"),
    "tab-billing": tab("Billing", true),
    "tab-team": tab("Team", false, false),
  })
  const tree = await device.tree()
  assert.equal(tree.has("panel-profile-text"), false)
  assert.equal(tree.get("panel-billing-text")?.text, "Billing settings")
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues with another tab selected", async () => {
  await device.press("tab-billing")
  await device.expectTree((tree) =>
    assert.equal(tree.get("tab-billing")?.selected, true)
  )
  assert.deepEqual(await device.audit(), [])
})
