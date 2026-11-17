import type { Color } from "../../foundation/color/convert"
import type {
  Part,
  PrimitiveContext,
} from "../../foundation/kernel/primitive-types"
import type {
  ColorPickerOptions,
  ColorPickerValueChangeReason,
} from "./color-picker"
import type { State } from "./color-picker-api"

type TouchReason = "track-press" | "drag" | "step-key"

type NativeTouchContext = {
  store: PrimitiveContext<ColorPickerOptions, State, string>["store"]
  begin: () => void
  setColor: (
    color: Color,
    details: { reason: ColorPickerValueChangeReason }
  ) => boolean
  commit: (details: { reason: ColorPickerValueChangeReason }) => void
}

type NativeTouch = {
  /** Starts a touch drag, or a screen reader's step, at the color shown now. */
  dragStart: (reason: TouchReason) => void
  /** Moves the color during it, and returns whether the value changed. */
  dragTo: (color: Color, reason: TouchReason) => boolean
  /** The touch lifted or the step is done: the value commits if it changed. */
  dragEnd: () => void
  /** The touch was taken away: the color goes back and nothing commits. */
  dragCancel: () => void
}

/**
 * What a native touch and a screen reader's adjustment call, as api methods.
 * Empty on the web, where the parts' pointer and key handlers do it; its
 * native twin has them.
 */
function nativeTouch(_context: NativeTouchContext) {
  return {} as NativeTouch
}

/** Focuses the area's thumb, else the first slider's, else the text input. */
function focusPicker(
  element: (slot: string) => HTMLElement | undefined,
  _parts: () => Iterable<Part>
) {
  ;(
    element("area-thumb") ??
    element("slider-thumb") ??
    element("input")
  )?.focus()
}

export {
  focusPicker,
  nativeTouch,
  type NativeTouch,
  type NativeTouchContext,
  type TouchReason,
}
