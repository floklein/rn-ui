import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("input.a11y")

const fields = [
  "input-email",
  "textarea-notes",
  "input-search",
  "clear-search",
  "input-disabled",
]

async function snapshot() {
  const tree = await device.tree()
  return Object.fromEntries(fields.map((id) => [id, tree.get(id)]))
}

const textbox = (label: string, value: string, enabled = true): Node => ({
  role: "textbox",
  label,
  enabled,
  value,
})

beforeEach(() => device.open("fixture-input"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  assert.deepEqual(await snapshot(), {
    "input-email": textbox("Email", ""),
    "textarea-notes": textbox("Notes", ""),
    "input-search": textbox("Search", "lisbon"),
    "clear-search": { role: "button", label: "Clear search", enabled: true },
    "input-disabled": textbox("Account", "hollis", false),
  })
})

test("the platform tree once the search is cleared", async () => {
  await device.press("clear-search")
  await device.expectTree((tree) =>
    assert.equal(tree.get("clear-search"), undefined)
  )
  await device.saveTree("cleared")
  const tree = await snapshot()
  assert.deepEqual(tree["input-search"], textbox("Search", ""))
  assert.equal(tree["clear-search"], undefined)
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})
