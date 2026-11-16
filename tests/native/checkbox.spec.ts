import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("checkbox")

const text = async (id: string) => (await device.node(id)).text
const checked = async (id: string) => (await device.node(id)).checked

beforeEach(() => device.open("fixture-checkbox"))

test("starts in its default state", async () => {
  const tree = await device.tree()
  assert.equal(tree.get("checkbox-terms")?.checked, false)
  assert.equal(tree.get("checkbox-mixed")?.checked, "mixed")
  assert.equal(tree.get("checkbox-locked")?.checked, true)
})

test("pressing checks and unchecks it", async () => {
  await device.press("checkbox-terms")
  await device.expectTree((tree) =>
    assert.equal(tree.get("checkbox-terms")?.checked, true)
  )
  assert.equal(await text("last-change"), "terms:true:press:touch")
  await device.press("checkbox-terms")
  await device.expectTree((tree) =>
    assert.equal(tree.get("checkbox-terms")?.checked, false)
  )
})

test("pressing a mixed checkbox checks it", async () => {
  await device.press("checkbox-mixed")
  await device.expectTree((tree) =>
    assert.equal(tree.get("checkbox-mixed")?.checked, true)
  )
})

test("a disabled checkbox ignores a press", async () => {
  assert.equal((await device.node("checkbox-locked")).enabled, false)
  await device.press("checkbox-locked")
  await device.press("checkbox-terms")
  await device.expectTree((tree) =>
    assert.equal(tree.get("last-change")?.text, "terms:true:press:touch")
  )
  assert.equal(await checked("checkbox-locked"), true)
})

test("the indicator stays mounted through onExit until done", async () => {
  assert.ok((await device.tree()).has("fading-indicator"))
  await device.press("checkbox-fading")
  await device.expectTree((tree) => {
    assert.equal(tree.get("fading-phase")?.text, "exiting")
    assert.equal(tree.get("checkbox-fading")?.checked, false)
    assert.ok(tree.has("fading-indicator"))
  })
  await device.press("fading-finish")
  await device.expectTree((tree) => {
    assert.equal(tree.get("fading-phase")?.text, "gone")
    assert.equal(tree.has("fading-indicator"), false)
  })
})

test("checking again before done keeps the indicator", async () => {
  await device.press("checkbox-fading")
  await device.expectTree((tree) =>
    assert.equal(tree.get("fading-phase")?.text, "exiting")
  )
  await device.press("checkbox-fading")
  await device.expectTree((tree) => {
    assert.equal(tree.get("checkbox-fading")?.checked, true)
    assert.equal(tree.get("fading-phase")?.text, "shown")
  })
  await device.press("fading-finish")
  await device.expectTree((tree) => assert.ok(tree.has("fading-indicator")))
})

test("a group's checkboxes and its parent follow one value", async () => {
  assert.equal(await checked("checkbox-all"), "mixed")
  await device.press("checkbox-coffee")
  await device.expectTree((tree) =>
    assert.equal(tree.get("group-value")?.text, "tea,coffee")
  )
  await device.press("checkbox-all")
  await device.expectTree((tree) => {
    assert.equal(tree.get("checkbox-all")?.checked, false)
    assert.equal(tree.get("group-value")?.text, "none")
  })
  await device.press("checkbox-all")
  await device.expectTree((tree) => {
    assert.equal(tree.get("checkbox-tea")?.checked, true)
    assert.equal(tree.get("checkbox-coffee")?.checked, true)
    assert.equal(tree.get("checkbox-milk")?.checked, false)
    assert.equal(tree.get("checkbox-all")?.checked, "mixed")
  })
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/checkbox/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-checkbox-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.role === "checkbox"))
    )
  }
})
