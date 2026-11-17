import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("accordion")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

beforeEach(() => device.open("fixture-accordion"))

test("each item knows its index from where it renders", async () => {
  await expectText("shipping-index", "0")
  await expectText("returns-index", "1")
})

test("pressing a trigger opens its item, from a touch, and opening settles at once", async () => {
  assert.equal((await device.tree()).has("shipping-text"), false)
  await device.press("shipping-trigger")
  await expectText("accordion-changes", "shipping:trigger-press:touch")
  await expectText("shipping-text", "Ships in two days.")
  await expectText("accordion-completes", "shipping:true")
})

test("opening another item closes the open one through onExit, settling once done", async () => {
  await device.press("shipping-trigger")
  await expectText("shipping-text", "Ships in two days.")
  await device.press("returns-trigger")
  await expectText("returns-text", "Return within 30 days.")
  const tree = await device.tree()
  assert.equal(tree.has("shipping-text"), false)
  assert.equal(
    tree.get("accordion-completes")?.text,
    "shipping:true returns:true"
  )
  await device.press("finish-exit")
  await expectText(
    "accordion-completes",
    "shipping:true returns:true shipping:false"
  )
  assert.equal((await device.tree()).has("shipping-panel"), false)
})

test("the controller opens an item", async () => {
  await device.press("open-returns")
  await expectText("accordion-changes", "returns:imperative:programmatic")
  await expectText("returns-text", "Return within 30 days.")
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/accordion/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-accordion-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.role === "button"))
    )
  }
})
