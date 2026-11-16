import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("toggle")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

beforeEach(() => device.open("fixture-toggle"))

test("pressing a toggle presses and unpresses it, from a touch", async () => {
  await device.press("toggle-bookmark")
  await expectText("bookmark-changes", "true:touch")
  await device.press("toggle-bookmark")
  await expectText("bookmark-changes", "true:touch false:touch")
})

test("a disabled toggle ignores a press", async () => {
  assert.equal((await device.node("toggle-pin")).enabled, false)
  await device.press("toggle-pin")
  await device.press("toggle-bookmark")
  await expectText("bookmark-changes", "true:touch")
})

test("a multiple group lists its pressed toggles in the order they render, not the order they were pressed", async () => {
  await device.press("toggle-underline")
  await device.press("toggle-bold")
  await expectText("format-value", "bold,underline:touch")
})

test("a toggle that renders between memoized siblings takes its place in the value", async () => {
  await device.press("toggle-underline")
  await device.press("add-strike")
  await device.press("toggle-strike")
  await device.press("toggle-italic")
  await expectText("format-value", "italic,strike,underline:touch")
})

test("a single group that can't be emptied keeps one toggle pressed", async () => {
  await device.press("toggle-center")
  await expectText("align-value", "center")
  await device.press("toggle-center")
  await device.press("toggle-start")
  await expectText("align-value", "start")
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/toggle/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-toggle-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.role === "togglebutton"))
    )
  }
})
