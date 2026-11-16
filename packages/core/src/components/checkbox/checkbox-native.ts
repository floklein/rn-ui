// What the checkbox root's `bind` does on the DOM host, restated for the
// native host: it joins its group. The group keeps an element per checkbox
// for its id, its order and focus, so a checkbox joins with a stand-in.
import type { CheckboxApi } from "./checkbox"

let joined = 0

// Whether `other` came after `node`, as `compareDocumentPosition` reports it.
const following = 4

/**
 * Joins a checkbox to the group it was given, and follows the group's value
 * from then on. The group orders its checkboxes by when they joined, and
 * `focus` moves focus to this one. Returns a cleanup that leaves.
 * @experimental
 */
function joinCheckboxGroup(api: CheckboxApi, focus: () => void) {
  const order = joined++
  const standIn = {
    id: "",
    order,
    isConnected: true,
    focus,
    compareDocumentPosition: (other: { order: number }) =>
      other.order > order ? following : 0,
  }
  const leave = api.internal.joinGroup(standIn as unknown as HTMLElement)
  return () => {
    standIn.isConnected = false
    leave()
  }
}

export { joinCheckboxGroup }
