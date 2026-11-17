import { type AutoScrollOptions, createAutoScroll } from "./auto-scroll"

// A drag that doesn't start with `pointerdown`, like a touch on the native
// host: each point places the item, a drag held near a scroller's edge
// scrolls it and places it again, and the end drops it or puts it back.
function followPoints(
  place: (x: number, y: number) => void,
  finish: (canceled: boolean) => void,
  autoScroll: Omit<AutoScrollOptions, "onScroll" | "ignore"> | false = {}
) {
  let x = 0
  let y = 0
  const track = () => place(x, y)
  const scroller =
    autoScroll === false
      ? undefined
      : createAutoScroll({ ...autoScroll, onScroll: track })
  return {
    move(pointX: number, pointY: number) {
      x = pointX
      y = pointY
      scroller?.update(x, y)
      track()
    },
    end(canceled: boolean) {
      scroller?.stop()
      finish(canceled)
    },
  }
}

export { followPoints }
