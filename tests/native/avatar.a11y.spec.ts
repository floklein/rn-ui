import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("avatar.a11y")

beforeEach(() => device.open("fixture-avatar"))

const settled = (tree: Map<string, { text?: string }>) => {
  assert.equal(tree.get("status-ada")?.text, "loaded")
  assert.equal(tree.get("status-grace")?.text, "error")
  assert.equal(tree.get("initials-hedy")?.text, "HL")
}

test("the platform tree once the images loaded or failed", async () => {
  await device.expectTree(settled)
  await device.saveTree("settled")
  const tree = await device.tree()
  assert.deepEqual(tree.get("image-ada"), {
    role: "image",
    label: "Ada Lovelace",
    enabled: true,
  })
  for (const [id, initials] of [
    ["grace", "GH"],
    ["alan", "AT"],
    ["hedy", "HL"],
  ]) {
    assert.equal(tree.get(`initials-${id}`)?.text, initials)
  }
  assert.equal(tree.has("initials-ada"), false)
  // UiAutomator lists every view, so only iOS shows a hidden image is gone.
  if (device.platform === "ios") {
    assert.equal(tree.has("image-grace"), false)
  }
})

test("no audit issues once the images loaded or failed", async () => {
  await device.expectTree(settled)
  assert.deepEqual(await device.audit(), [])
})
