import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("file-input")

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

beforeEach(() => device.open("fixture-file-input"))

test("the trigger adds the files pick returns that pass the checks", async () => {
  await device.press("trigger")
  await expectText("file-value", "Beach photo.heic and Lease report.pdf by picker")
  await expectText("file-rejected", "Shopping notes.txt file-type")
})

test("a remove button removes its own file", async () => {
  await device.press("trigger")
  await expectText("file-value", "Beach photo.heic and Lease report.pdf by picker")
  await device.pressNamed("Remove Beach photo.heic")
  await expectText("file-value", "Lease report.pdf by remove-press")
  const tree = await device.tree()
  assert.ok(
    [...tree.values()].some((node) => node.label === "Remove Lease report.pdf")
  )
})

test("a disabled field disables the trigger and the remove buttons", async () => {
  await device.press("trigger")
  await expectText("file-value", "Beach photo.heic and Lease report.pdf by picker")
  await device.press("toggle-disabled")
  await device.expectTree((tree) => {
    assert.equal(tree.get("trigger")?.enabled, false)
    const remove = [...tree.values()].find(
      (node) => node.label === "Remove Beach photo.heic"
    )
    assert.equal(remove?.enabled, false)
  })
  await device.press("trigger")
  await device.pressNamed("Remove Beach photo.heic")
  await expectText("file-value", "Beach photo.heic and Lease report.pdf by picker")
})

test("the controller clears the files", async () => {
  await device.press("trigger")
  await expectText("file-value", "Beach photo.heic and Lease report.pdf by picker")
  await device.press("clear")
  await expectText("file-value", "no files by imperative")
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/file-input/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-file-input-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok([...tree.values()].some((node) => node.role === "button"))
    )
  }
})
