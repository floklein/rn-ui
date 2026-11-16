import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("pagination")

const named = (tree: Map<string, Node>, label: string) =>
  [...tree.values()].find((node) => node.label === label)

const expectValue = (text: string) =>
  device.expectTree((tree) => assert.equal(tree.get("page-value")?.text, text))

const expectCurrent = (label: string) =>
  device.expectTree((tree) => {
    const selected = [...tree.values()].filter(
      (node) => node.role === "button" && node.selected
    )
    assert.deepEqual(
      selected.map((node) => node.label),
      [label]
    )
  })

beforeEach(() => device.open("fixture-pagination"))

test("pressing a page goes there, from a touch", async () => {
  await expectCurrent("1")
  await device.pressNamed("3")
  await expectValue("3:item-press:touch")
  await expectCurrent("3")
})

test("Next and Previous step one page", async () => {
  await device.press("next")
  await expectValue("2:next-press:touch")
  await device.press("next")
  await expectValue("3:next-press:touch")
  await device.press("previous")
  await expectValue("2:previous-press:touch")
  await expectCurrent("2")
})

test("First and Last go to the ends, where they and their step are disabled", async () => {
  let tree = await device.tree()
  assert.equal(tree.get("first")?.enabled, false)
  assert.equal(tree.get("previous")?.enabled, false)
  await device.press("last")
  await expectValue("12:last-press:touch")
  await expectCurrent("12")
  tree = await device.tree()
  assert.equal(tree.get("next")?.enabled, false)
  assert.equal(tree.get("last")?.enabled, false)
  assert.equal(tree.get("first")?.enabled, true)
  await device.press("next")
  await device.press("first")
  await expectValue("1:first-press:touch")
})

test("the range follows the page, with an ellipsis for each gap", async () => {
  await device.press("set-page")
  await expectValue("7:imperative:programmatic")
  await expectCurrent("7")
  const tree = await device.tree()
  for (const label of ["1", "6", "7", "8", "12"]) {
    assert.ok(named(tree, label), label)
  }
  assert.equal(named(tree, "3"), undefined)
  assert.equal(named(tree, "…"), undefined)
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/pagination/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-pagination-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.selected))
    )
  }
})
