import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice, type Node } from "./device.ts"

const device = useDevice("calendar")

const named = (tree: Map<string, Node>, label: string) =>
  [...tree.values()].find((node) => node.label === label)

const expectText = (id: string, text: string) =>
  device.expectTree((tree) => assert.equal(tree.get(id)?.text, text))

const expectSelected = (labels: string[]) =>
  device.expectTree((tree) =>
    assert.deepEqual(
      [...tree.values()]
        .filter((node) => node.role === "button" && node.selected)
        .map((node) => node.label),
      labels
    )
  )

beforeEach(() => device.open("fixture-calendar"))

test("pressing a day selects it, from a touch", async () => {
  await expectSelected(["Friday, October 16, 2026"])
  await device.pressNamed("Tuesday, October 20, 2026")
  await expectText("value-readout", "2026-10-20:item-press:touch")
  await expectSelected(["Tuesday, October 20, 2026"])
})

test("Next and Previous turn the month, and the heading follows", async () => {
  await expectText("heading", "October 2026")
  await device.press("next")
  await expectText("month-readout", "2026-11:next-press:touch")
  await expectText("heading", "November 2026")
  await device.press("previous")
  await device.press("previous")
  await expectText("month-readout", "2026-09:previous-press:touch")
  await expectText("heading", "September 2026")
})

test("pressing a day of the month before selects it and shows its month", async () => {
  await device.pressNamed("Sunday, September 27, 2026")
  await expectText("value-readout", "2026-09-27:item-press:touch")
  await expectText("month-readout", "2026-09:item-press:touch")
  await expectText("heading", "September 2026")
})

test("an unavailable date is disabled, and a press leaves the value", async () => {
  const tree = await device.tree()
  assert.equal(named(tree, "Thursday, October 8, 2026")?.enabled, false)
  assert.equal(named(tree, "Friday, October 9, 2026")?.enabled, true)
  await device.pressNamed("Thursday, October 8, 2026")
  await device.pressNamed("Friday, October 9, 2026")
  await expectText("value-readout", "2026-10-09:item-press:touch")
})

test("the controller turns the months to the date it focuses", async () => {
  await device.press("focus-christmas")
  await expectText("month-readout", "2026-12:imperative:programmatic")
  await expectText("heading", "December 2026")
})

test("names and the first day of the week follow the locale, from Hermes's Intl", async () => {
  let tree = await device.tree()
  assert.equal(tree.get("weekday-0")?.label, "Sunday")
  assert.equal(tree.get("weekday-6")?.label, "Saturday")
  await device.press("next-locale")
  await expectText("heading", "Oktober 2026")
  tree = await device.tree()
  assert.equal(tree.get("weekday-0")?.label, "Montag")
  assert.ok(named(tree, "Freitag, 16. Oktober 2026")?.selected)
  await device.press("next-locale")
  tree = await device.tree()
  const locale = tree.get("device-locale")?.text
  assert.ok(locale)
  await expectText(
    "heading",
    new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(Date.UTC(2026, 9, 1))
  )
})

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/calendar/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-calendar-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok(
        [...tree.values()].some(
          (node) => node.role === "button" && /\d{4}$/.test(node.label)
        )
      )
    )
  }
})
