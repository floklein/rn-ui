import type { PrimitiveContext } from "../../foundation/kernel/primitive-types"
import type {
  OTPInputOptions,
  OTPInputValueChangeReason,
  State,
} from "./otp-input-api"
import type { Selection } from "./otp-input-model"

type NativeFieldContext = {
  store: PrimitiveContext<OTPInputOptions, State, string>["store"]
  change: (
    key: "value",
    value: string,
    details: { reason: OTPInputValueChangeReason }
  ) => boolean
  complete: (value: string, reason: OTPInputValueChangeReason) => void
  isControlled: () => boolean
  focus: () => void
}

type NativeField = {
  /** Takes the field's whole text after an edit, cleaned as typing and pasting are on the web. */
  typeText: (text: string) => void
  /** Takes the field's selection, moved onto the character under a collapsed caret. */
  selectText: (selection: Selection) => void
  /** Takes the field gaining or losing focus. */
  focusText: (focused: boolean) => void
  /** Selects slot `index`, focusing the field first. */
  pressSlot: (index: number) => void
}

/**
 * What a native text field reports, as api methods. Empty on the web, where
 * `bind` reads the input; its native twin has them.
 */
function nativeField(_context: NativeFieldContext) {
  return {} as NativeField
}

export { nativeField, type NativeField, type NativeFieldContext }
