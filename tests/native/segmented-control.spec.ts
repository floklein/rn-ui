import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("segmented-control")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

const expectChecked = (id: string, checked: boolean) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.checked, checked))

// The checked item's left edge and width, as the indicator's state holds them.
async function indicatorBox() {
  const text = (await device.node("indicator-box")).text ?? ""
  const [left, width] = text.split(",").map(Number)
  assert.ok(width > 0, `The indicator isn't measured: ${text}`)
  return { left, width }
}

beforeEach(() => device.open("fixture-segmented-control"))

test("with nothing checked, no item is checked and the indicator is unmeasured", async () => {
  await expectChecked("item-list", false)
  await expectText("indicator-box", "unmeasured")
  await expectText("last-change", "none")
})

test("pressing an item checks it and unchecks the others, from a touch", async () => {
  await device.press("item-grid")
  await expectText("last-change", "grid:item-press:touch")
  await expectChecked("item-grid", true)
  await device.press("item-list")
  await expectChecked("item-list", true)
  await expectChecked("item-grid", false)
})

test("a disabled item and a disabled control ignore a press", async () => {
  const tree = await device.tree()
  assert.equal(tree.get("item-table")?.enabled, false)
  assert.equal(tree.get("item-dark")?.enabled, false)
  await device.press("item-table")
  await device.press("item-dark")
  await device.press("item-list")
  await expectText("last-change", "list:item-press:touch")
  await expectChecked("item-dark", false)
})

test("a read-only control keeps its items enabled but changes nothing", async () => {
  assert.equal((await device.node("item-large")).enabled, true)
  await device.press("item-large")
  await expectChecked("item-small", true)
  await expectChecked("item-large", false)
})

test("the controller checks an item", async () => {
  await device.press("set-board")
  await expectText("last-change", "board:imperative:programmatic")
  await expectChecked("item-board", true)
})

test("the indicator's box follows the checked item", async () => {
  await device.press("item-list")
  const first = await indicatorBox()
  await device.press("item-board")
  await device.expectTree((tree) =>
    assert.notEqual(
      tree.get("indicator-box")?.text,
      `${first.left},${first.width}`
    )
  )
  const moved = await indicatorBox()
  assert.ok(
    moved.left >= first.left + first.width,
    `The indicator moved to ${moved.left}, left of ${first.left + first.width}.`
  )
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/segmented-control/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-segmented-control-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.role === "radio"))
    )
  }
})
