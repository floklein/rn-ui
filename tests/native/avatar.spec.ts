import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("avatar")

beforeEach(() => device.open("fixture-avatar"))

test("a loaded image replaces its fallback", async () => {
  await device.expectTree((tree) => {
    assert.equal(tree.get("status-ada")?.text, "loaded")
    assert.equal(tree.has("initials-ada"), false)
  })
})

test("an image that fails keeps its fallback", async () => {
  await device.expectTree((tree) => {
    assert.equal(tree.get("status-grace")?.text, "error")
    assert.equal(tree.get("initials-grace")?.text, "GH")
  })
})

test("an image with no source fails at once", async () => {
  await device.expectTree((tree) => {
    assert.equal(tree.get("status-alan")?.text, "error")
    assert.equal(tree.get("initials-alan")?.text, "AT")
  })
})

test("a fallback with a delay shows once it has passed", async () => {
  await device.expectTree((tree) =>
    assert.equal(tree.get("initials-hedy")?.text, "HL")
  )
})

test("a new source keeps the loaded image showing", async () => {
  await device.expectTree((tree) =>
    assert.equal(tree.get("status-ada")?.text, "loaded")
  )
  await device.press("change-image")
  await device.expectTree((tree) => {
    assert.equal(tree.get("status-ada")?.text, "loaded")
    assert.equal(tree.has("initials-ada"), false)
  })
})

test("removing the image brings the fallback back, with the idle status", async () => {
  await device.expectTree((tree) =>
    assert.equal(tree.get("status-ada")?.text, "loaded")
  )
  await device.press("remove-image")
  await device.expectTree((tree) => {
    assert.equal(tree.get("status-ada")?.text, "idle")
    assert.equal(tree.get("initials-ada")?.text, "AL")
  })
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/avatar/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-avatar-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok(
        [...tree.values()].some(
          (node) => node.label === "shadcn" || node.text === "CN"
        )
      )
    )
  }
})
