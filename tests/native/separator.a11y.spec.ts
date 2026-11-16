import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("separator.a11y")

beforeEach(() => device.open("fixture-separator"))

test("the platform tree reads the text around separators and nothing for them", async () => {
  await device.saveTree("first")
  const tree = await device.tree()
  for (const [id, text] of [
    ["heading", "Hollis Grant"],
    ["profile", "Profile"],
    ["billing", "Billing"],
    ["or", "or"],
  ]) {
    assert.equal(tree.get(id)?.text, text)
  }
  for (const id of [
    "separator-flip",
    "separator-vertical",
    "separator-decorative",
  ]) {
    assert.equal(tree.get(id)?.label ?? "", "", id)
    assert.notEqual(tree.get(id)?.role, "text", id)
  }
})

test("no audit issues", async () => {
  assert.deepEqual(await device.audit(), [])
})
