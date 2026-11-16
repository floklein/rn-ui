import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("radio")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

const expectChecked = (id: string, checked: boolean) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.checked, checked))

beforeEach(() => device.open("fixture-radio"))

test("pressing a radio checks it and unchecks the others, from a touch", async () => {
  await device.press("radio-small")
  await expectText("last-change", "small:item-press:touch")
  await expectChecked("radio-small", true)
  await expectChecked("radio-medium", false)
})

test("a disabled radio and a disabled group ignore a press", async () => {
  const tree = await device.tree()
  assert.equal(tree.get("radio-large")?.enabled, false)
  assert.equal(tree.get("radio-dark")?.enabled, false)
  await device.press("radio-large")
  await device.press("radio-dark")
  await device.press("radio-small")
  await expectText("last-change", "small:item-press:touch")
  await expectChecked("radio-dark", false)
})

test("a read-only group keeps its radios enabled but changes nothing", async () => {
  assert.equal((await device.node("radio-free")).enabled, true)
  await device.press("radio-free")
  await device.press("radio-small")
  await expectText("last-change", "small:item-press:touch")
  await expectChecked("radio-pro", true)
})

test("the controller checks a radio", async () => {
  await device.press("set-small")
  await expectText("last-change", "small:imperative:programmatic")
  await expectChecked("radio-small", true)
})

test("the indicator stays mounted through onExit until done", async () => {
  await device.press("radio-small")
  await device.expectTree((tree) => {
    assert.equal(tree.get("fading-phase")?.text, "exiting")
    assert.ok(tree.has("indicator-medium"))
  })
  await device.press("fading-finish")
  await device.expectTree((tree) => {
    assert.equal(tree.get("fading-phase")?.text, "gone")
    assert.equal(tree.has("indicator-medium"), false)
  })
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/radio/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-radio-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.role === "radio"))
    )
  }
})
