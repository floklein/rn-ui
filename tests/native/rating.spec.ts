import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("rating")

const named = (tree: Map<string, Node>, label: string) =>
  [...tree.values()].find((node) => node.label === label)

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

const expectChecked = (label: string, checked: boolean) =>
  device.expectTree((tree) =>
    assert.equal(named(tree, label)?.checked, checked)
  )

beforeEach(() => device.open("fixture-rating"))

test("pressing a star checks it, from a touch", async () => {
  await device.pressNamed("Food 3")
  await expectText("food-value", "3:touch")
  await expectChecked("Food 3", true)
  await device.pressNamed("Food 5")
  await expectText("food-value", "5:touch")
  await expectChecked("Food 3", false)
})

test("a half star is its own radio, over the first half of its star", async () => {
  await device.pressNamed("Room 3.5")
  await expectText("room-value", "3.5")
  await expectChecked("Room 3.5", true)
  await expectChecked("Room 2.5", false)
})

test("pressing the checked star clears a deselectable rating", async () => {
  await device.pressNamed("Room 2.5")
  await expectText("room-value", "null")
  await expectChecked("Room 2.5", false)
})

test("a disabled rating ignores a press", async () => {
  assert.equal(named(await device.tree(), "Service 1")?.enabled, false)
  await device.pressNamed("Service 1")
  await device.pressNamed("Food 2")
  await expectText("food-value", "2:touch")
})

test("the controller sets the score", async () => {
  await device.press("set-food")
  await expectText("food-value", "1:programmatic")
  await expectChecked("Food 1", true)
})

test("a read-only rating is one image, named by its score, whose radios no one reaches", async () => {
  const tree = await device.tree()
  assert.equal(named(tree, "Rated 4.2 out of 5")?.role, "image")
  assert.equal(named(tree, "Rated 4 out of 5"), undefined)
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/rating/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-rating-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok(
        [...tree.values()].some(
          (node) => node.role === "radio" || node.role === "image"
        )
      )
    )
  }
})
