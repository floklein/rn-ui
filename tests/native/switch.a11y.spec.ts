import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("switch.a11y")

const switches = [
  "switch-wifi",
  "switch-airplane",
  "switch-bluetooth",
  "switch-hotspot",
  "switch-roaming",
  "switch-data-saver",
  "switch-night-shift",
]

async function snapshot() {
  const tree = await device.tree()
  return Object.fromEntries(switches.map((id) => [id, tree.get(id)]))
}

const on = (label: string, enabled = true): Node => ({
  role: "switch",
  label,
  checked: true,
  enabled,
})
const off = (label: string, enabled = true): Node => ({
  role: "switch",
  label,
  checked: false,
  enabled,
})

beforeEach(() => device.open("fixture-switch"))

test("the platform tree at first", async () => {
  await device.saveTree("first")
  assert.deepEqual(await snapshot(), {
    "switch-wifi": on("Wi-Fi"),
    "switch-airplane": off("Airplane mode"),
    "switch-bluetooth": off("Bluetooth"),
    "switch-hotspot": off("Hotspot"),
    "switch-roaming": on("Roaming", false),
    "switch-data-saver": off("Data saver"),
    "switch-night-shift": off("Night shift"),
  })
})

test("the platform tree after each switch is pressed", async () => {
  for (const id of switches) {
    await device.press(id)
  }
  await device.expectTree((tree) =>
    assert.equal(tree.get("switch-night-shift")?.checked, true)
  )
  await device.saveTree("pressed")
  assert.deepEqual(await snapshot(), {
    "switch-wifi": off("Wi-Fi"),
    "switch-airplane": on("Airplane mode"),
    "switch-bluetooth": on("Bluetooth"),
    "switch-hotspot": off("Hotspot"),
    "switch-roaming": on("Roaming", false),
    "switch-data-saver": off("Data saver"),
    "switch-night-shift": on("Night shift"),
  })
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})

test("no audit issues with every switch on", async () => {
  for (const id of [
    "switch-airplane",
    "switch-bluetooth",
    "switch-night-shift",
  ]) {
    await device.press(id)
  }
  await device.expectTree((tree) =>
    assert.equal(tree.get("switch-night-shift")?.checked, true)
  )
  assert.deepEqual(await device.audit(), [])
})
