import type { Part } from "../kernel/primitive-types"

/**
 * Focuses `element()`. Its native twin asks the native host to focus the part
 * of `slot` among `parts`, the one with `key` when the slot has several.
 */
function focusPart(
  element: () => HTMLElement | undefined,
  _parts: () => Iterable<Part>,
  _slot: string,
  _key?: string | null
) {
  element()?.focus()
}

export { focusPart }
