import type { Color } from "../../foundation/color/convert"
import { isDisabled } from "../../foundation/forms/form"
import { nativeHost } from "../../foundation/kernel/native-host"
import type { Part } from "../../foundation/kernel/primitive-types"
import type { Twin } from "../../foundation/kernel/twin"
import type * as Mirrored from "./color-picker-touch"
import type { NativeTouchContext, TouchReason } from "./color-picker-touch"
import type * as Native from "./color-picker-touch.native"

// The calls the web's pointer handlers and keydown make, for the responder's
// touches and a screen reader's increment and decrement.
function nativeTouch({ store, begin, setColor, commit }: NativeTouchContext) {
  let gesture: { from: Color; reason: TouchReason } | undefined
  return {
    dragStart(reason: TouchReason) {
      begin()
      gesture = { from: store.get().color, reason }
    },
    dragTo(color: Color, reason: TouchReason) {
      const state = store.get()
      if (!gesture || isDisabled(state) || state.readOnly) {
        return false
      }
      if (!setColor(color, { reason })) {
        return false
      }
      gesture.reason = reason
      return true
    },
    dragEnd() {
      const ended = gesture
      gesture = undefined
      if (ended) {
        commit({ reason: ended.reason })
      }
    },
    dragCancel() {
      const ended = gesture
      gesture = undefined
      if (ended && ended.from !== store.get().color) {
        setColor(ended.from, { reason: ended.reason })
      }
    },
  }
}

const order = ["area-thumb", "slider-thumb", "input"]

function focusPicker(
  _element: (slot: string) => HTMLElement | undefined,
  parts: () => Iterable<Part>
) {
  const mounted = [...parts()]
  for (const slot of order) {
    const part = mounted.find((each) => each.slot === slot)
    if (part) {
      nativeHost()?.focus(part)
      return
    }
  }
}

true satisfies Twin<typeof Mirrored, typeof Native>

export { focusPicker, nativeTouch }
export type {
  NativeTouch,
  NativeTouchContext,
  TouchReason,
} from "./color-picker-touch"
