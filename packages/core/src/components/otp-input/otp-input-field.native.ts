import { isDisabled } from "../../foundation/forms/form"
import type { Twin } from "../../foundation/kernel/twin"
import type * as Mirrored from "./otp-input-field"
import type { NativeFieldContext } from "./otp-input-field"
import type * as Native from "./otp-input-field.native"
import {
  focusSelection,
  insertCode,
  isValidCode,
  pastedCode,
  pressSelection,
  type Selection,
  slotSelection,
} from "./otp-input-model"

// The api methods a native TextInput's events and a slot's press call, where
// the web's `bind` reads the <input>.
function nativeField({
  store,
  change,
  complete,
  isControlled,
  focus,
}: NativeFieldContext) {
  let afterDelete = false
  // Where a press on a slot puts the selection once the field has focus.
  let pressed: Selection | undefined
  // Native selection reports the state overrides: the caret of refused text,
  // and Android's caret at the end when a press on a slot focused the field.
  let refused = false
  let focusCaret: Selection | undefined
  // The caret a tap on the field puts under the finger, where the slot
  // pressed wins. With no caret move there's no report, and this waits.
  let tapped = false

  return {
    // Only the whole new text arrives, so what was inserted is found against
    // the value and the selection, then cleaned as `insertMany` does.
    typeText(text: string) {
      const { pattern, maxLength, value: previous, selection } = store.get()
      afterDelete = text.length < previous.length
      tapped = false
      let next = text
      if (next !== previous && !isValidCode(next, pattern, maxLength)) {
        const inserted = text.slice(
          selection.start,
          text.length - (previous.length - selection.end)
        )
        const code = pastedCode(inserted, pattern)
        next = code
          ? insertCode(previous, selection, code, maxLength)
          : previous
      }
      refused =
        next === previous || !change("value", next, { reason: "input-change" })
      if (refused) {
        return
      }
      if (!isControlled()) {
        store.set({ value: next })
      }
      complete(next, "input-change")
    },
    // As `syncSelection` does, a deletion's caret stays where the character was.
    selectText(current: Selection) {
      const expected = focusCaret
      focusCaret = undefined
      if (
        !store.get().focused ||
        refused ||
        (expected?.start === current.start && expected.end === current.end)
      ) {
        refused = false
        return
      }
      if (tapped) {
        tapped = false
        return
      }
      const deleted = afterDelete && current.start === current.end
      afterDelete = false
      const { selection, value, maxLength } = store.get()
      // A controlled owner may not have taken the text the caret is in.
      if (current.end > value.length) {
        store.set({ selection: focusSelection(value.length, maxLength) })
        return
      }
      const next = deleted
        ? null
        : slotSelection(current, selection, value.length, maxLength)
      store.set({
        selection: next ? { start: next.start, end: next.end } : current,
      })
    },
    focusText(focused: boolean) {
      const { value, maxLength } = store.get()
      if (focused === store.get().focused) {
        return
      }
      tapped &&= focused
      store.set(
        focused
          ? {
              focused,
              selection: pressed ?? focusSelection(value.length, maxLength),
            }
          : { focused }
      )
      focusCaret =
        focused && pressed
          ? { start: value.length, end: value.length }
          : undefined
      pressed = undefined
    },
    pressSlot(index: number) {
      afterDelete = false
      focusCaret = undefined
      const { value, maxLength, focused } = store.get()
      if (isDisabled(store.get())) {
        return
      }
      tapped = true
      const selection = pressSelection(index, value.length, maxLength)
      if (focused) {
        store.set({ selection })
      } else {
        pressed = selection
        focus()
      }
    },
  }
}

true satisfies Twin<typeof Mirrored, typeof Native, "nativeField">

export { nativeField }
export type { NativeField, NativeFieldContext } from "./otp-input-field"
