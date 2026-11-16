import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("button")

const text = async (id: string) => (await device.node(id)).text

beforeEach(() => device.open("fixture-button"))

test("pressing runs its action with the touch source", async () => {
  await device.press("button-share")
  await device.expectTree((tree) =>
    assert.equal(tree.get("presses")?.text, "share:touch")
  )
})

test("an async action keeps it pending until it settles, and presses meanwhile do nothing", async () => {
  await device.press("button-save")
  await device.expectTree((tree) => {
    assert.equal(tree.get("save-state")?.text, "pending")
    assert.equal(tree.get("button-save")?.enabled, false)
  })
  await device.press("button-save")
  await device.press("button-share")
  await device.expectTree((tree) =>
    assert.equal(tree.get("presses")?.text, "save:touch share:touch")
  )
  await device.press("finish-waiting")
  await device.expectTree((tree) => {
    assert.equal(tree.get("save-state")?.text, "idle")
    assert.equal(tree.get("button-save")?.enabled, true)
  })
  await device.press("button-save")
  await device.expectTree((tree) =>
    assert.equal(tree.get("presses")?.text, "save:touch share:touch save:touch")
  )
})

test("a failed action leaves its error, and the next press runs it again", async () => {
  await device.press("button-sync")
  await device.expectTree((tree) => {
    assert.equal(tree.get("sync-state")?.text, "error")
    assert.equal(tree.get("button-sync")?.enabled, true)
  })
  await device.press("button-sync")
  await device.expectTree((tree) =>
    assert.equal(tree.get("presses")?.text, "sync:touch sync:touch")
  )
  assert.equal(await text("sync-state"), "error")
})

test("a disabled button ignores a press", async () => {
  assert.equal((await device.node("button-delete")).enabled, false)
  await device.press("button-delete")
  await device.press("button-share")
  await device.expectTree((tree) =>
    assert.equal(tree.get("presses")?.text, "share:touch")
  )
})

test("a button focusable when disabled ignores a press", async () => {
  assert.equal((await device.node("button-publish")).enabled, false)
  await device.press("button-publish")
  await device.press("button-share")
  await device.expectTree((tree) =>
    assert.equal(tree.get("presses")?.text, "share:touch")
  )
})

test("a button given the link role is a link", async (t) => {
  if (device.platform !== "ios") {
    t.skip("React Native gives a link no Android class of its own")
    return
  }
  await device.open("screen-button-link")
  await device.expectTree((tree) => {
    const links = [...tree.values()].filter((node) => node.role === "link")
    assert.deepEqual(
      links.map((node) => node.label),
      ["Get Started", "Changelog"]
    )
  })
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/button/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-button-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok(
        [...tree.values()].some(
          (node) => node.role === "button" || node.role === "link"
        )
      )
    )
  }
})
