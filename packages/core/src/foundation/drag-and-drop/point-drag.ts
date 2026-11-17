import { type AutoScrollOptions, createAutoScroll } from "./auto-scroll"

type PointDrag = {
  move: (x: number, y: number) => void
  end: (canceled: boolean, event?: Event) => void
}

// Drags that don't start with `pointerdown`, like a native touch. Only the
// latest drag's handle acts, so a late move or end from a finished gesture
// can't take over the next one; destroying the instance puts its item back.
function createPointDrags(
  onDestroy: (cleanup: () => void) => void,
  isMoving: () => boolean
) {
  let current: PointDrag | undefined
  onDestroy(() => current?.end(true))
  return function follow(
    place: (x: number, y: number) => void,
    finish: (canceled: boolean, event?: Event) => void,
    autoScroll: Omit<AutoScrollOptions, "onScroll" | "ignore"> | false = {}
  ) {
    let x = 0
    let y = 0
    const track = () => place(x, y)
    const scroller =
      autoScroll === false
        ? undefined
        : createAutoScroll({ ...autoScroll, onScroll: () => live() && track() })
    const live = () => current === drag && isMoving()
    const drag: PointDrag = {
      move(pointX, pointY) {
        if (!live()) {
          return
        }
        x = pointX
        y = pointY
        scroller?.update(x, y)
        track()
      },
      end(canceled, event) {
        scroller?.stop()
        if (live()) {
          current = undefined
          finish(canceled, event)
        }
      },
    }
    current = drag
    return drag
  }
}

export { createPointDrags }
