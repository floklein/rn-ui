import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("file-input.a11y")

const removers = (tree: Map<string, Node>) =>
  [...tree.values()].filter((node) => node.label.startsWith("Remove "))

async function pickFiles() {
  await device.press("trigger")
  await device.expectTree((tree) =>
    assert.equal(
      tree.get("file-value")?.text,
      "photo.png and report.pdf by picker"
    )
  )
}

beforeEach(() => device.open("fixture-file-input"))

test("the platform tree at first: the trigger named by the field's label and its own text", async () => {
  await device.saveTree("first")
  const tree = await device.tree()
  assert.deepEqual(tree.get("trigger"), {
    role: "button",
    label: "Attachments Browse files",
    enabled: true,
  })
  assert.deepEqual(removers(tree), [])
})

test("the platform tree with files: a remove button named for each", async () => {
  await pickFiles()
  await device.saveTree("files")
  assert.deepEqual(removers(await device.tree()), [
    { role: "button", label: "Remove photo.png", enabled: true },
    { role: "button", label: "Remove report.pdf", enabled: true },
  ])
})

test("the platform tree once disabled", async () => {
  await pickFiles()
  await device.press("toggle-disabled")
  await device.expectTree((tree) =>
    assert.equal(tree.get("trigger")?.enabled, false)
  )
  await device.saveTree("disabled")
  assert.deepEqual(
    removers(await device.tree()).map((node) => node.enabled),
    [false, false]
  )
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues with files", async () => {
  await pickFiles()
  assert.deepEqual(await device.audit(), [])
})
