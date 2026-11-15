import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("switch")

const lastChange = async () => (await device.node("last-change")).text

beforeEach(() => device.open("fixture-switch"))

test("starts in its default state", async () => {
  const tree = await device.tree()
  assert.equal(tree.get("switch-wifi")?.checked, true)
  assert.equal(tree.get("switch-airplane")?.checked, false)
})

test("pressing toggles it", async () => {
  await device.press("switch-wifi")
  await device.expectTree((tree) =>
    assert.equal(tree.get("switch-wifi")?.checked, false)
  )
  assert.equal(await lastChange(), "wifi:false:press:touch")
  await device.press("switch-wifi")
  await device.expectTree((tree) =>
    assert.equal(tree.get("switch-wifi")?.checked, true)
  )
})

test("a controlled switch follows its value", async () => {
  await device.press("switch-bluetooth")
  await device.expectTree((tree) =>
    assert.equal(tree.get("switch-bluetooth")?.checked, true)
  )
  await device.press("bluetooth-off")
  await device.expectTree((tree) =>
    assert.equal(tree.get("switch-bluetooth")?.checked, false)
  )
})

test("a change can be cancelled", async () => {
  await device.press("switch-hotspot")
  await device.expectTree((tree) =>
    assert.equal(tree.get("last-change")?.text, "hotspot:true:press:touch")
  )
  assert.equal((await device.node("switch-hotspot")).checked, false)
})

test("a disabled switch ignores a press", async () => {
  const roaming = await device.node("switch-roaming")
  assert.equal(roaming.enabled, false)
  assert.equal(roaming.checked, true)
  await device.press("switch-roaming")
  await device.press("switch-airplane")
  await device.expectTree((tree) =>
    assert.equal(tree.get("last-change")?.text, "airplane:true:press:touch")
  )
  assert.equal((await device.node("switch-roaming")).checked, true)
})

test("a read-only switch can't be changed", async () => {
  const dataSaver = await device.node("switch-data-saver")
  assert.equal(dataSaver.enabled, true)
  await device.press("switch-data-saver")
  await device.press("switch-airplane")
  await device.expectTree((tree) =>
    assert.equal(tree.get("last-change")?.text, "airplane:true:press:touch")
  )
  assert.equal((await device.node("switch-data-saver")).checked, false)
})

test("a controller toggles it from outside", async () => {
  await device.press("controller-toggle")
  await device.expectTree((tree) =>
    assert.equal(tree.get("switch-night-shift")?.checked, true)
  )
  await device.press("controller-read")
  await device.expectTree((tree) =>
    assert.equal(tree.get("night-shift-read")?.text, "true")
  )
})

test("a controller does nothing once its switch is gone", async () => {
  await device.press("night-shift-remove")
  await device.expectTree((tree) =>
    assert.equal(tree.has("switch-night-shift"), false)
  )
  await device.press("controller-toggle")
  await device.press("controller-read")
  await device.expectTree((tree) =>
    assert.equal(tree.get("night-shift-read")?.text, "undefined")
  )
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/switch/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-switch-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.role === "switch"))
    )
  }
})
