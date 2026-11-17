import { nativeHost } from "../kernel/native-host"
import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./auto-scroll"
import type * as Native from "./auto-scroll.native"

type AutoScrollOptions = {
  edge?: number
  speed?: number
  onScroll?: () => void
  ignore?: () => Element | null | undefined
}

// Only the library's Scroll Areas scroll: the host knows where they are, and
// a plain ScrollView has nothing core can drive.
function createAutoScroll(options: AutoScrollOptions = {}) {
  let point: { x: number; y: number } | null = null
  let frame = 0

  function tick() {
    frame = 0
    const edge = options.edge ?? 48
    const speed = options.speed ?? 18
    if (point && nativeHost()?.scrollNear(point, { edge, speed })) {
      options.onScroll?.()
      frame = requestAnimationFrame(tick)
    }
  }

  return {
    update(x: number, y: number) {
      point = { x, y }
      frame ||= requestAnimationFrame(tick)
    },
    stop() {
      point = null
      cancelAnimationFrame(frame)
      frame = 0
    },
  }
}

true satisfies Twin<typeof Mirrored, typeof Native>

export { type AutoScrollOptions, createAutoScroll }
