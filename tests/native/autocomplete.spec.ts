import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("autocomplete")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

const expectShown = (id: string, shown: boolean) =>
  device.expectTree((tree) => assert.equal(tree.has(id), shown))

let density: number | undefined
async function scale() {
  if (device.platform === "ios") {
    return 1
  }
  density ??= (
    (await device.driver.execute("mobile: deviceInfo", {})) as {
      displayDensity: number
    }
  ).displayDensity
  return density / 160
}

async function typeIn(text: string) {
  await device.press("input")
  await device.driver.waitUntil(() => device.driver.isKeyboardShown())
  await device.type(text)
}

beforeEach(() => device.open("fixture-autocomplete"))

afterEach(async () => {
  if (await device.driver.isKeyboardShown()) {
    await device.driver.hideKeyboard().catch(() => {})
  }
  if ((await device.tree()).has("content")) {
    await device.press("under")
    await expectShown("content", false)
  }
})

test("typing opens the list 4 points below the field, lined up with its start, in its first frame", async () => {
  const field = await device.rect("input")
  await typeIn("r")
  await expectShown("content", true)
  const unit = await scale()
  const content = await device.rect("content")
  const gap = content.y - (field.y + field.height)
  assert.ok(
    Math.abs(gap - 4 * unit) <= 2 * unit,
    `${gap} between field and list, not ${4 * unit}`
  )
  assert.ok(
    Math.abs(content.x - field.x) <= 2 * unit,
    `the list starts at ${content.x}, the field at ${field.x}`
  )
  const layouts = (await device.tree()).get("layouts")?.text ?? ""
  assert.equal(layouts.split(" ").length, 1, `laid out at ${layouts}`)
})

test("typing filters the suggestions, and keeps the keyboard up", async () => {
  await typeIn("gr")
  await device.expectTree((tree) => {
    assert.equal(tree.has("item-grape"), true)
    assert.equal(tree.has("item-apple"), false)
  })
  assert.equal(await device.driver.isKeyboardShown(), true)
  await device.type("x")
  await expectShown("empty", true)
})

test("pressing a suggestion fills the field in and closes the list", async () => {
  await device.press("trigger")
  await expectShown("content", true)
  await device.press("item-cherry")
  await expectShown("content", false)
  assert.equal((await device.node("input")).value, "Cherry")
  await expectText(
    "changes",
    "true:trigger-press =Cherry:item-press false:item-press"
  )
})

test("a disabled suggestion can't be chosen", async () => {
  await device.press("trigger")
  await device.press("item-banana")
  await expectShown("content", true)
  await expectText("changes", "true:trigger-press")
})

test("return chooses the highlighted suggestion, then submits the text", async () => {
  await typeIn("ch")
  await expectShown("item-cherry", true)
  await device.type("\n")
  await expectShown("content", false)
  assert.equal((await device.node("input")).value, "Cherry")
  await device.type("\n")
  await expectText("submitted", "Cherry")
})

test("a press outside closes the list and reaches what is under it", async () => {
  await device.press("trigger")
  await expectShown("content", true)
  await device.press("under")
  await expectShown("content", false)
  await expectText("presses", "1")
  await expectText("changes", "true:trigger-press false:outside-press")
})

test("Android's back closes the list with the back reason", async (t) => {
  if (device.platform !== "android") {
    return t.skip("Android only")
  }
  await device.press("trigger")
  await expectShown("content", true)
  await device.back()
  await expectShown("content", false)
  await expectText("changes", "true:trigger-press false:back")
})

test("Clear empties the field", async () => {
  await typeIn("ap")
  await device.driver.hideKeyboard().catch(() => {})
  await device.press("under")
  await device.press("clear")
  await expectShown("clear", false)
  assert.equal((await device.node("input")).value ?? "", "")
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/autocomplete/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-autocomplete-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) => assert.ok(tree.size > 1))
  }
})
