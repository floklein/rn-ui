import {
  type NativeBehavior,
  nativeHost,
  type NativeTouch,
} from "../../foundation/kernel/native-host"
import type { Part } from "../../foundation/kernel/primitive-types"
import { isRTL } from "../../foundation/platform/env"
import {
  findItem,
  type ToastRegionApi,
  type ToastRegionStoreState,
} from "./toast-api"
import { swipeDirections } from "./toast-dom"
import {
  swipeAxis,
  type SwipeDirection,
  swipeOffset,
  swipeOutcome,
} from "./swipe"

/**
 * Where a toast is while it's swiped, as the web's `--toast-swipe-x` and
 * `--toast-swipe-y`, and the direction it was dismissed toward once a swipe
 * dismissed it.
 * @experimental
 */
type NativeToastSwipe = {
  x: number
  y: number
  direction?: SwipeDirection
}

/**
 * A region's swipes, which the host reads to move each toast.
 * @experimental
 */
type NativeToast = {
  /** The swipe of the toast with that id, while one is under way or after it dismissed the toast. */
  swipe: (toastId: string) => NativeToastSwipe | undefined
  subscribe: (listener: () => void) => () => void
}

type ToastPart = Part<ToastRegionStoreState, ToastRegionApi>

function createSwipes() {
  let swipes: ReadonlyMap<string, NativeToastSwipe> = new Map()
  const listeners = new Set<() => void>()
  const set = (toastId: string, swipe: NativeToastSwipe | undefined) => {
    const next = new Map(swipes)
    if (swipe) {
      next.set(toastId, swipe)
    } else if (!next.delete(toastId)) {
      return
    }
    swipes = next
    listeners.forEach((listener) => listener())
  }
  const bridge: NativeToast = {
    swipe: (toastId) => swipes.get(toastId),
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
  return { bridge, set }
}

const regions = new WeakMap<object, ReturnType<typeof createSwipes>>()

function swipesOf(api: object) {
  let found = regions.get(api)
  if (!found) {
    found = createSwipes()
    regions.set(api, found)
  }
  return found
}

/**
 * The swipes of a toast region's toasts, for the native host to move them.
 * @experimental
 */
const nativeToast = (api: object) => swipesOf(api).bridge

function follow(part: ToastPart) {
  const { api, store, key } = part
  const toastId = String(key)
  const { set } = swipesOf(api)
  let start: { x: number; y: number } | undefined
  let axis: "x" | "y" | undefined
  let samples: { x: number; y: number; time: number }[] = []
  const directions = () => {
    const { side, align } = store.get()
    return swipeDirections(side, align, isRTL(null))
  }
  const finish = () => {
    if (axis) {
      api.resume("swipe")
    }
    start = undefined
    axis = undefined
    samples = []
  }
  const stop = nativeHost()?.follow(part, {
    accepts() {
      const item = findItem(store.get().items, toastId)
      return !!item && !item.leaving && item.toast.dismissible !== false
    },
    claims: (dx, dy) => !!swipeAxis(dx, dy, directions()),
    start(touch) {
      start = touch
      axis = undefined
      samples = [{ x: touch.x, y: touch.y, time: Date.now() }]
    },
    move(touch: NativeTouch) {
      if (!start) {
        return
      }
      const x = touch.x - start.x
      const y = touch.y - start.y
      if (!axis) {
        const picked = swipeAxis(x, y, directions())
        if (!picked) {
          return
        }
        axis = picked
        api.pause("swipe")
      }
      samples = [...samples.slice(-1), { ...touch, time: Date.now() }]
      set(toastId, swipeOffset(x, y, axis, directions()))
    },
    end() {
      const [from, to] = samples
      const swiped = axis && start && to ? { axis, from, to, start } : undefined
      finish()
      if (!swiped) {
        set(toastId, undefined)
        return
      }
      const elapsed = Math.max(1, swiped.to.time - swiped.from.time)
      const x = swiped.to.x - swiped.start.x
      const y = swiped.to.y - swiped.start.y
      const direction = swipeOutcome({
        x: swiped.axis === "x" ? x : 0,
        y: swiped.axis === "y" ? y : 0,
        velocityX: (swiped.to.x - swiped.from.x) / elapsed,
        velocityY: (swiped.to.y - swiped.from.y) / elapsed,
        directions: directions(),
      })
      if (direction && api.internal.close(toastId, "swipe")) {
        set(toastId, {
          ...swipeOffset(x, y, swiped.axis, directions()),
          direction,
        })
        return
      }
      set(toastId, undefined)
    },
    cancel() {
      finish()
      set(toastId, undefined)
    },
  })
  return () => {
    stop?.()
    finish()
    set(toastId, undefined)
  }
}

/**
 * Toast's behavior on the native host, as a toast's `bind` does on the DOM
 * host: each toast follows the responder's touches and is dismissed by a
 * swipe toward its region's side, or its aligned side.
 * @experimental
 */
const toastNative: NativeBehavior<ToastRegionApi> = { root: follow }

export { nativeToast, type NativeToast, type NativeToastSwipe, toastNative }
