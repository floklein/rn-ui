import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("reorder")

beforeEach(() => device.open("fixture-reorder"))

const center = (box: {
  x: number
  y: number
  width: number
  height: number
}) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
})

async function expectReadout(id: string, text: string | RegExp) {
  await device.expectTree((tree) => {
    const shown = tree.get(id)?.text ?? ""
    if (typeof text === "string") {
      assert.equal(shown, text)
    } else {
      assert.match(shown, text)
    }
  })
}

test("a touch drag reorders a list, committed when the finger lifts", async () => {
  const spring = center(await device.rect("season-Spring"))
  const autumn = await device.rect("season-Autumn")
  await device.drag(spring, {
    x: spring.x,
    y: autumn.y + autumn.height * 0.9,
  })
  await expectReadout("order-readout", "Order Summer Autumn Spring Winter")
})

test("a tap on an item moves nothing", async () => {
  await device.press("season-Spring")
  await expectReadout("order-readout", "Order Spring Summer Autumn Winter")
})

test("a touch drag moves an item to another list", async () => {
  const boots = center(await device.rect("pack-Boots"))
  const passport = await device.rect("pack-Passport")
  await device.drag(boots, {
    x: passport.x + passport.width / 2,
    y: passport.y + passport.height * 0.2,
  })
  await expectReadout(
    "lists-readout",
    "Closet Jacket Scarf; Bag Boots Passport Charger"
  )
})

test("inside a same-axis ScrollView whose scrolling the drag turns off, the list reorders and the view stays", async () => {
  const plan = center(await device.rect("task-Plan"))
  const review = await device.rect("task-Review")
  await device.drag(
    plan,
    { x: plan.x, y: review.y + review.height * 0.9 },
    300,
    0
  )
  await expectReadout(
    "plain-readout",
    "Plain Draft Review Plan Edit Test Ship, scrolled 0"
  )
})

test("beside the drag, a swipe on the same ScrollView still scrolls it", async () => {
  const view = await device.rect("plain")
  const x = view.x + view.width - 6
  await device.drag({ x, y: view.y + view.height - 10 }, { x, y: view.y + 10 })
  await expectReadout(
    "plain-readout",
    /^Plain Plan Draft .*, scrolled [1-9]\d*$/
  )
})

test("held near a Scroll Area's bottom edge, a drag scrolls it and carries the item down", async () => {
  const row = center(await device.rect("row-Row-1"))
  const area = await device.rect("area")
  await device.drag(
    row,
    { x: row.x, y: area.y + area.height - area.height * 0.05 },
    600,
    100,
    2000
  )
  await device.expectTree((tree) => {
    const text = tree.get("area-readout")?.text ?? ""
    const [, at, top] = /^Area Row 1 at (\d+), top (\d+)$/.exec(text) ?? []
    assert.ok(Number(top) > 0, `${text}: the area didn't scroll`)
    assert.ok(Number(at) > 5, `${text}: Row 1 stayed in view's rows`)
  })
})
