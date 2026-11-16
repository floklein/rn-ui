import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("tabs")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

const expectSelected = (id: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.selected, true))

// The selected tab's left edge and width, as the indicator's state holds them.
async function indicatorBox() {
  const text = (await device.node("indicator-box")).text ?? ""
  const [left, width] = text.split(",").map(Number)
  assert.ok(width > 0, `The indicator isn't measured: ${text}`)
  return { left, width }
}

beforeEach(() => device.open("fixture-tabs"))

test("with nothing selected, the first enabled tab shows its panel, calling nothing", async () => {
  await expectSelected("tab-profile")
  await expectText("panel-profile-text", "Profile settings")
  await expectText("tabs-changes", "none")
})

test("pressing a tab selects it and shows its panel, from a touch", async () => {
  await device.press("tab-billing")
  await expectText("tabs-changes", "billing:item-press:touch")
  await expectSelected("tab-billing")
  await expectText("panel-billing-text", "Billing settings")
  const tree = await device.tree()
  assert.equal(tree.get("tab-profile")?.selected, undefined)
  assert.equal(tree.has("panel-profile-text"), false)
})

test("a disabled tab ignores a press", async () => {
  assert.equal((await device.node("tab-team")).enabled, false)
  await device.press("tab-team")
  await device.press("tab-billing")
  await expectText("tabs-changes", "billing:item-press:touch")
})

test("the controller selects a tab", async () => {
  await device.press("select-billing")
  await expectText("tabs-changes", "billing:imperative:programmatic")
  await expectSelected("tab-billing")
})

test("a selected tab that leaves selects the first enabled one, as a removal", async () => {
  await device.press("tab-billing")
  await device.press("remove-billing")
  await expectText(
    "tabs-changes",
    "billing:item-press:touch profile:item-removed:programmatic"
  )
  await expectSelected("tab-profile")
})

test("the indicator's box follows the selected tab", async () => {
  const first = await indicatorBox()
  await device.press("tab-billing")
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
    "../../examples/components/tabs/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-tabs-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.selected))
    )
  }
})
