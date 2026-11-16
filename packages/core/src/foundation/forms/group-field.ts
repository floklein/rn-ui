import type { Part } from "../kernel/primitive-types"
import { focusFromSurroundings, textFields } from "./text-field"
import { type TextControl, writeValue } from "./value"

const fieldSelector = 'input:not([type="hidden"]), textarea'

/**
 * The text field inside the element of a group's `slot`, which the group's
 * presses reach: `field` when the group knows its own, or the first one in
 * the element. Its native twin asks the native host for the field inside
 * that part.
 */
function groupField(
  element: () => HTMLElement | undefined,
  _parts: () => Iterable<Part>,
  _slot: string,
  field?: () => TextControl | undefined
) {
  const control =
    field ??
    (() => element()?.querySelector<TextControl>(fieldSelector) ?? undefined)
  return {
    control,
    clear(event?: Event) {
      const el = control()
      if (!el) {
        return
      }
      const field = textFields.get(el)
      if (field) {
        field.internal.clearPress(event)
      } else {
        writeValue(el, "", { asUser: true })
      }
      el.focus()
    },
    pressAround: (event?: Event) =>
      focusFromSurroundings(event, element(), control()),
  }
}

export { groupField }
