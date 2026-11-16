import { nativeElement } from "../../foundation/kernel/native-element"
import {
  type NativeBehavior,
  nativeHost,
  type NativeTouch,
} from "../../foundation/kernel/native-host"
import type { Part } from "../../foundation/kernel/primitive-types"
import { stepOnGrid } from "../../foundation/number/steps"
import { isRTL } from "../../foundation/platform/env"
import { bindPageLocale } from "../../foundation/text/locale"
import {
  isDisabled,
  rangeOf,
  type SliderApi,
  type State,
  valuesOf,
} from "./slider-api"
import { fractionAlong, valueAt } from "./slider-values"

type SliderPart = Part<State, SliderApi>
type Box = { left: number; top: number; width: number; height: number }

const tracks = new WeakMap<SliderApi, Part>()

const isLocked = (state: State) => isDisabled(state) || state.readOnly

// The thumb a touch landed on, which keeps its offset instead of jumping.
function thumbOf(touch: NativeTouch, api: SliderApi) {
  const { target } = touch
  return target?.api === api &&
    (target.slot === "thumb" || target.slot === "thumb-input")
    ? ((target.props as { index?: number }).index ?? 0)
    : null
}

// The responder's start, move and end make the calls the web's pointer
// handlers make. A responder cancelled, taken by a scroll view or unmounted
// puts the value back and commits nothing.
function follow(part: SliderPart) {
  const { api, store } = part
  let box: Box | undefined
  const at = (touch: NativeTouch, measured: Box) =>
    valueAt(
      fractionAlong(touch, measured, {
        rtl: isRTL(null),
        vertical: store.get().orientation === "vertical",
      }),
      rangeOf(store.get())
    )
  const stop = nativeHost()?.follow(part, {
    accepts: () => !isLocked(store.get()),
    start(touch) {
      box = nativeHost()?.box(tracks.get(api) ?? part)
      if (box) {
        api.internal.begin(at(touch, box), thumbOf(touch, api))
      }
    },
    move(touch) {
      if (box) {
        api.internal.move(at(touch, box))
      }
    },
    end: () => api.internal.end(),
    cancel: () => api.internal.cancel(),
  })
  return () => {
    stop?.()
    api.internal.cancel()
  }
}

// A screen reader's increment and decrement, a step at a time, as a swipe
// adjusts the web's range input.
function adjust(part: SliderPart) {
  return nativeHost()?.adjustable(part, (direction) => {
    const state = part.store.get()
    if (isLocked(state)) {
      return
    }
    const index = (part.props as { index?: number }).index ?? 0
    const value = valuesOf(state.value)[index] ?? state.min
    part.api.internal.adjust(
      index,
      stepOnGrid(value, { direction, size: "step" }, rangeOf(state))
    )
  })
}

/**
 * Slider's behavior on the native host, as its `bind` and pointer handlers
 * do on the DOM host: the root reads the locale it formats in, the control
 * follows touch drags along the track, and each thumb takes a screen
 * reader's increment and decrement.
 * @experimental
 */
const sliderNative: NativeBehavior<SliderApi> = {
  root: (part: SliderPart) =>
    bindPageLocale(nativeElement(part), (pageLocale) =>
      part.store.set({ pageLocale })
    ),
  track(part) {
    tracks.set(part.api, part)
    return () => {
      if (tracks.get(part.api) === part) {
        tracks.delete(part.api)
      }
    }
  },
  control: follow,
  "thumb-input": adjust,
}

export { sliderNative }
