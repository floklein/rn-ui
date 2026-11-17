import { describe, expect, test, vi } from "vitest"
import { scrollArea } from "../src/components/scroll-area/scroll-area"
import { createNativeScrollView } from "../src/components/scroll-area/scroll-area-native"

const options = { edge: 48, speed: 18 }

// A 100 by 100 viewport over 400 by 400 points of content, scrolled to `at`.
function viewport(at = { x: 0, y: 0 }) {
  const view = createNativeScrollView(
    scrollArea({ id: "area" }).part("root", {}).store
  )
  const scrollTo = vi.fn()
  view.attach({ scrollTo })
  view.report({
    offset: at,
    size: { width: 100, height: 100 },
    content: { width: 400, height: 400 },
  })
  return { view, scrollTo }
}

describe("a drag near a native scroll area's edge", () => {
  test("scrolls a step toward the edge, faster the closer it is", () => {
    const { view, scrollTo } = viewport()
    expect(view.edgeScroll({ x: 50, y: 100 }, options)).toEqual(["y"])
    expect(scrollTo).toHaveBeenLastCalledWith("y", 18, false)
    view.edgeScroll({ x: 50, y: 100 - 100 / 6 }, options)
    expect(scrollTo).toHaveBeenLastCalledWith("y", 27, false)
  })

  test("scrolls nothing from the middle, or past either end", () => {
    const { view, scrollTo } = viewport({ x: 0, y: 300 })
    expect(view.edgeScroll({ x: 50, y: 50 }, options)).toEqual([])
    expect(view.edgeScroll({ x: 50, y: 100 }, options)).toEqual([])
    expect(view.edgeScroll({ x: 0, y: 50 }, options)).toEqual([])
    expect(scrollTo).not.toHaveBeenCalled()
  })

  test("scrolls only the axes it's given, as an inner scroll area took the others", () => {
    const { view } = viewport({ x: 50, y: 50 })
    expect(view.edgeScroll({ x: 100, y: 100 }, options)).toEqual(["x", "y"])
    expect(view.edgeScroll({ x: 100, y: 100 }, options, ["x"])).toEqual(["x"])
  })
})
