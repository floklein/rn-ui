import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("checkbox.a11y")

const checkboxes = [
  "checkbox-terms",
  "checkbox-mixed",
  "checkbox-locked",
  "checkbox-fading",
  "checkbox-all",
  "checkbox-tea",
  "checkbox-coffee",
  "checkbox-milk",
]

async function snapshot() {
  const tree = await device.tree()
  return Object.fromEntries(checkboxes.map((id) => [id, tree.get(id)]))
}

const checkbox = (
  label: string,
  checked: boolean | "mixed",
  enabled = true
): Node => ({ role: "checkbox", label, checked, enabled })

beforeEach(() => device.open("fixture-checkbox"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  assert.deepEqual(await snapshot(), {
    "checkbox-terms": checkbox("Terms", false),
    "checkbox-mixed": checkbox("Mixed", "mixed"),
    "checkbox-locked": checkbox("Locked", true, false),
    "checkbox-fading": checkbox("Fading", true),
    "checkbox-all": checkbox("All drinks", "mixed"),
    "checkbox-tea": checkbox("Tea", true),
    "checkbox-coffee": checkbox("Coffee", false),
    "checkbox-milk": checkbox("Milk", false, false),
  })
})

test("the platform tree after each checkbox is pressed", async () => {
  for (const id of checkboxes) {
    await device.press(id)
  }
  await device.expectTree((tree) =>
    assert.equal(tree.get("checkbox-all")?.checked, false)
  )
  await device.saveTree("pressed")
  assert.deepEqual(await snapshot(), {
    "checkbox-terms": checkbox("Terms", true),
    "checkbox-mixed": checkbox("Mixed", true),
    "checkbox-locked": checkbox("Locked", true, false),
    "checkbox-fading": checkbox("Fading", false),
    "checkbox-all": checkbox("All drinks", false),
    "checkbox-tea": checkbox("Tea", false),
    "checkbox-coffee": checkbox("Coffee", false),
    "checkbox-milk": checkbox("Milk", false, false),
  })
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues with every checkbox checked", async () => {
  for (const id of ["checkbox-terms", "checkbox-mixed", "checkbox-coffee"]) {
    await device.press(id)
  }
  await device.expectTree((tree) =>
    assert.equal(tree.get("checkbox-coffee")?.checked, true)
  )
  assert.deepEqual(await device.audit(), [])
})
