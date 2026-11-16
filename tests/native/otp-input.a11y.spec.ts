import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("otp-input.a11y")

// The fields take no test ID, so they're found by name.
async function fields() {
  const tree = await device.tree()
  return [...tree.values()].filter((node) => node.role === "textbox")
}

beforeEach(() => device.open("fixture-otp-input"))

test("the platform tree at first: one text field per code, and no slot", async () => {
  await device.saveTree("first")
  assert.deepEqual(await fields(), [
    { role: "textbox", label: "Code", enabled: true, value: "" },
    { role: "textbox", label: "Disabled code", enabled: false, value: "12" },
  ])
})

test("the platform tree with a code filled", async () => {
  await device.press("fill-code")
  await device.expectTree((tree) =>
    assert.equal(tree.get("code-slots")?.text, "1 2 3 4")
  )
  await device.saveTree("filled")
  assert.deepEqual((await fields())[0], {
    role: "textbox",
    label: "Code",
    enabled: true,
    value: "1234",
  })
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})
