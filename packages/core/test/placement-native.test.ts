import { expect, test } from "vitest"
import { popover } from "../src/components/popover/popover"
import type { PopoverContentProps } from "../src/components/popover/popover"
import { placeNative } from "../src/foundation/popups/placement-native"

const screen = { x: 0, y: 0, width: 400, height: 800 }

function content(props: PopoverContentProps = {}) {
  const instance = popover({ id: "p" })
  instance.part("content", props)
  return instance.api
}

test("places the popup below the anchor's center with the web's state", () => {
  const placed = placeNative(content(), {
    anchor: { x: 100, y: 100, width: 80, height: 40 },
    popup: { width: 200, height: 100 },
    viewport: screen,
    rtl: false,
  })
  expect(placed).toEqual({
    x: 40,
    y: 144,
    state: {
      side: "bottom",
      align: "center",
      anchorWidth: 80,
      anchorHeight: 40,
      availableWidth: 384,
      availableHeight: 648,
      transformOrigin: "100px 0px",
      arrowOffset: 100,
    },
    arrow: undefined,
  })
})

test("flips to the side with room and points the arrow at the anchor", () => {
  const placed = placeNative(content({ sideOffset: 10 }), {
    anchor: { x: 100, y: 740, width: 80, height: 40 },
    popup: { width: 200, height: 100 },
    arrow: { width: 12, height: 6 },
    viewport: screen,
    rtl: false,
  })
  expect(placed.y).toBe(630)
  expect(placed.state.side).toBe("top")
  expect(placed.state.transformOrigin).toBe("100px 100px")
  expect(placed.arrow).toEqual({
    offset: 94,
    side: "top",
    align: "center",
    arrowClamped: false,
  })
})

test("clamps an arrow whose anchor is past the popup's corner", () => {
  const placed = placeNative(content({ side: "bottom", align: "start" }), {
    anchor: { x: 0, y: 100, width: 10, height: 20 },
    popup: { width: 200, height: 100 },
    arrow: { width: 12, height: 6 },
    viewport: screen,
    rtl: false,
  })
  expect(placed.x).toBe(8)
  expect(placed.arrow).toMatchObject({ offset: 6, arrowClamped: true })
  expect(placed.state.align).toBe("start")
})

test("keeps the popup and its arrow inside the viewport it's given", () => {
  const placed = placeNative(content(), {
    anchor: { x: 100, y: 500, width: 80, height: 40 },
    popup: { width: 200, height: 100 },
    viewport: { x: 0, y: 50, width: 400, height: 580 },
    rtl: false,
  })
  expect(placed.state.side).toBe("top")
  expect(placed.state.availableHeight).toBe(500 - 4 - 8 - 50)
})

test("measures the arrow from inside the popup's border", () => {
  const placed = placeNative(content(), {
    anchor: { x: 100, y: 100, width: 80, height: 40 },
    popup: { width: 200, height: 100 },
    border: { left: 2, top: 2, right: 2, bottom: 2 },
    arrow: { width: 12, height: 6 },
    viewport: screen,
    rtl: false,
  })
  expect(placed.state.arrowOffset).toBe(98)
  expect(placed.arrow?.offset).toBe(92)
})

test("lines start up with the anchor's right edge right to left", () => {
  const placed = placeNative(content({ align: "start" }), {
    anchor: { x: 200, y: 100, width: 80, height: 40 },
    popup: { width: 100, height: 100 },
    viewport: screen,
    rtl: true,
  })
  expect(placed.x).toBe(180)
  expect(placed.state.transformOrigin).toBe("100px 0px")
})
