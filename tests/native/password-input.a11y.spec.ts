import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

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

test("the platform tree at first", async () => {
  await device.saveTree("first")
  const tree = await snapshot()
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(tree).map(([id, node]) => [
        id,
        node && { ...node, value: undefined },
      ])
    ),
    {
      "password-control": {
        role: "textbox",
        label: "Password",
        enabled: true,
        secure: true,
        value: undefined,
      },
      "password-toggle": toggle("Show password", false),
      "password-readonly": {
        role: "textbox",
        label: "Recovery key",
        enabled: false,
        secure: true,
        value: undefined,
      },
      "toggle-readonly": toggle("Show recovery key", false),
      "password-disabled": {
        role: "textbox",
        label: "Account password",
        enabled: false,
        secure: true,
        value: undefined,
      },
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
