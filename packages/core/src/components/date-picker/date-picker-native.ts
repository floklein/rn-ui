import { flagWhileBound } from "../../foundation/kernel/bound-keys"
import { nativeElement } from "../../foundation/kernel/native-element"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import { partIn, popupNative } from "../../foundation/popups/popup-native"
import { preferredDate } from "../calendar/calendar-api"
import { textOf, type DatePickerApi, type State } from "./date-picker-api"

/**
 * Date Picker's behavior on the native host: a popup's, whose focus on open
 * goes to the day with the calendar's tab stop, and Calendar's, whose root
 * reads the locale and today and whose days join the roving group. The hint
 * describes the inputs while it's mounted.
 * @experimental
 */
const datePickerNative: NativeBehavior<DatePickerApi> = {
  ...popupNative<DatePickerApi>({
    focus({ internal }) {
      const content = partIn(internal, "content")
      if (!content) {
        return
      }
      const state = content.store.get() as State
      return (
        partIn(internal, "day", state.focused ?? preferredDate(state)) ??
        content
      )
    },
  }),
  root: (part) => part.api.internal.bindRoot(nativeElement(part)),
  hint: (part) => flagWhileBound(part.store, "hinted"),
  day: (part) => part.api.internal.roving.bind(nativeElement(part), part),
}

/**
 * The text a date picker's input shows, start or `end`: what was typed over
 * the value, else its date in the locale's short format.
 * @experimental
 */
const datePickerText = (state: object, end?: boolean) =>
  textOf(state as State, end ? 1 : 0)

export { datePickerNative, datePickerText }
