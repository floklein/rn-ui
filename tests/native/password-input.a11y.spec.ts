import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("password-input.a11y")

const parts = [
  "password-control",
  "password-toggle",
  "password-readonly",
  "toggle-readonly",
  "password-disabled",
  "toggle-disabled",
]

async function snapshot() {
  const tree = await device.tree()
  return Object.fromEntries(parts.map((id) => [id, tree.get(id)]))
}

// Android names a toggle button by its role's class, iOS by a button's value.
const toggle = (label: string, checked: boolean, enabled = true) => ({
  role: device.platform === "ios" ? "button" : "togglebutton",
  label,
  enabled,
  checked,
})

beforeEach(() => device.open("fixture-password-input"))

// A hidden password's value is the OS's mask, read only for not being the password.
const hidden = (label: string, enabled: boolean): Node => ({
  role: "textbox",
  label,
  enabled,
  secure: true,
})

const unmasked = (node: Node | undefined) => {
  if (!node?.secure) {
    return node
  }
  const { value: _value, ...rest } = node
  return rest
}

test("the platform tree at first", async () => {
  await device.saveTree("first")
  const tree = await snapshot()
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(tree).map(([id, node]) => [id, unmasked(node)])
    ),
    {
      "password-control": hidden("Password", true),
      "password-toggle": toggle("Show password", false),
      "password-readonly": hidden("Recovery key", false),
      "toggle-readonly": toggle("Show recovery key", false),
      "password-disabled": hidden("Account password", false),
      "toggle-disabled": toggle("Show account password", false, false),
    }
  )
  assert.notEqual(tree["password-readonly"]?.value, "7Hq2-vX9p")
})

test("the platform tree once the read-only key is shown", async () => {
  await device.press("toggle-readonly")
  await device.expectTree((tree) =>
    assert.equal(tree.get("toggle-readonly")?.checked, true)
  )
  await device.saveTree("shown")
  const tree = await snapshot()
  assert.deepEqual(tree["password-readonly"], {
    role: "textbox",
    label: "Recovery key",
    enabled: false,
    value: "7Hq2-vX9p",
  })
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})
