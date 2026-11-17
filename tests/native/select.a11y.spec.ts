import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("select.a11y")

beforeEach(() => device.open("fixture-select"))

afterEach(async () => {
  for (const name of ["modal", "plain", "multi"]) {
    if ((await device.tree()).has(`${name}-content`)) {
      await device.press(`${name}-trigger`).catch(() => device.back())
      await device.expectTree((tree) =>
        assert.equal(tree.has(`${name}-content`), false)
      )
    }
  }
})

async function open(name: string) {
  await device.press(`${name}-trigger`)
  await device.expectTree((tree) => assert.ok(tree.has(`${name}-content`)))
}

// The value the OS gives the trigger: iOS's accessibility value, or what
// Android writes into the description after the label.
async function valueOf(id: string) {
  const attrs = await device.attributes(id)
  return device.platform === "ios"
    ? (attrs.value ?? "")
    : (attrs["content-desc"] ?? "").split(", ").slice(1).join(", ")
}

test("the platform tree closed: the trigger is named by its label, with the value as its value", async () => {
  await device.saveTree("closed")
  const trigger = await device.node("modal-trigger")
  assert.equal(
    device.platform === "ios" ? trigger.label : trigger.label.split(", ")[0],
    "Fruit modal"
  )
  assert.equal(trigger.enabled, true)
  assert.equal(trigger.expanded, undefined)
  assert.equal(await valueOf("modal-trigger"), "Pick a fruit")
})

test("the platform tree open: each option is a button, the chosen one selected, a disabled one disabled", async () => {
  await open("plain")
  await device.press("plain-cherry")
  await device.expectTree((tree) =>
    assert.equal(tree.has("plain-content"), false)
  )
  assert.equal(await valueOf("plain-trigger"), "Cherry")
  await open("plain")
  await device.saveTree("open")
  const tree = await device.tree()
  assert.deepEqual(tree.get("plain-cherry"), {
    role: "button",
    label: "Cherry",
    selected: true,
    enabled: true,
  })
  assert.deepEqual(tree.get("plain-apple"), {
    role: "button",
    label: "Apple",
    enabled: true,
  })
  assert.equal(tree.get("plain-banana")?.label, "Banana")
  if (device.platform === "android") {
    assert.equal(tree.get("plain-banana")?.enabled, false)
  }
  if (device.platform === "ios") {
    assert.equal(tree.get("plain-trigger")?.expanded, true)
  }
})

test("the platform tree open modal: the screen behind is hidden on Android", async () => {
  await open("modal")
  const tree = await device.tree()
  assert.equal(tree.get("modal-apple")?.role, "button")
  if (device.platform === "android") {
    assert.equal(tree.has("under"), false)
  }
})

test("no audit issues closed", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues open", async () => {
  await open("plain")
  assert.deepEqual(await device.audit(), [])
})
