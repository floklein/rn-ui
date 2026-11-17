import { partOf } from "../../foundation/kernel/native-element"
import type { Twin } from "../../foundation/kernel/twin"
import type { CarouselPage } from "./carousel-layout"
import type { CarouselAxis } from "./carousel-motion"
import { layoutOf } from "./carousel-native"
import type * as Mirrored from "./carousel-dom"
import type * as Native from "./carousel-dom.native"

type Slide = { el: HTMLElement; key: string }

// From the layouts the views reported, which leave out the content's
// translation. Nothing is measured until every view has laid out.
function readCarouselLayout(
  viewport: HTMLElement,
  slides: readonly Slide[],
  axis: CarouselAxis
) {
  const { vertical, rtl } = axis
  const api: object | undefined = partOf(viewport)?.api
  const outer = api && layoutOf(api, "viewport")
  const inner = api && layoutOf(api, "content")
  const boxes = slides.map(({ key }) => api && layoutOf(api, "item", key))

  const laidOut = !!outer && !!inner && boxes.every(Boolean)
  const size = (vertical ? outer?.height : outer?.width) ?? 0
  const measured = (laidOut ? slides : []).map(({ key }, index) => {
    const box = boxes[index]!
    if (vertical) {
      return { key, box: { start: inner!.y + box.y, size: box.height } }
    }
    const left = inner!.x + box.x
    return {
      key,
      box: { start: rtl ? size - left - box.width : left, size: box.width },
    }
  })
  const end = Math.max(0, ...measured.map(({ box }) => box.start + box.size))
  return {
    slides: measured,
    viewportSize: size,
    maxScroll: Math.max(0, end - size),
    paddingStart: 0,
    paddingEnd: 0,
  }
}

// Views have no CSS order, so a loop rewinds instead of rotating the slides.
function writeSlideOrder(_slides: readonly Slide[], _first: number) {}

function clearSlideOrder(_slides: readonly Slide[]) {}

// The motion moves to the pages itself; nothing snaps natively.
function writeSnapAreas(
  _slides: readonly Slide[],
  _pages: readonly CarouselPage[],
  _vertical: boolean
) {}

function clearSnapAreas(_slides: readonly Slide[], _align: string) {}

// The adapter's slide labels itself from its index and the slide count.
function labelSlide(
  _el: HTMLElement,
  _key: string,
  _store: {
    get: () => { order: string[] }
    subscribe: (listener: () => void) => () => void
  }
) {
  return () => {}
}

true satisfies Twin<typeof Mirrored, typeof Native>

export {
  clearSlideOrder,
  clearSnapAreas,
  labelSlide,
  readCarouselLayout,
  writeSlideOrder,
  writeSnapAreas,
}
