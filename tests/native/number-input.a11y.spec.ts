import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("number-input.a11y")

const parts = [
  "amount-decrement",
  "amount-control",
  "amount-increment",
  "locked-decrement",
  "locked-control",
  "locked-increment",
]

async function snapshot() {
  const tree = await device.tree()
  return Object.fromEntries(parts.map((id) => [id, tree.get(id)]))
}

const button = (label: string, enabled = true): Node => ({
  role: "button",
  label,
  enabled,
})

beforeEach(() => device.open("fixture-number-input"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  assert.deepEqual(await snapshot(), {
    "amount-decrement": button("Decrease"),
    "amount-control": {
      role: "textbox",
      label: "Amount",
      enabled: true,
      value: "",
    },
    "amount-increment": button("Increase"),
    "locked-decrement": button("Decrease locked", false),
    "locked-control": {
      role: "textbox",
      label: "Locked",
      enabled: false,
      value: "3",
    },
    "locked-increment": button("Increase locked", false),
  })
})

test("the platform tree once a controller sets the value", async () => {
  await device.press("set-amount")
  await device.expectTree((tree) =>
    assert.equal(tree.get("amount-control")?.value, "250")
  )
  await device.saveTree("set")
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})
