// PROTOTYPE (issue #14). Moving focus to a part, which has a native twin
// (`focus-part.native.ts`) that asks the native host instead.
import type { Part } from "../kernel/primitive-types"

/**
 * Moves focus to a part of an instance. On the DOM host it focuses
 * `element()`. The native twin requests focus on the part of `slot` among
 * `parts`, with `key` when the slot has several.
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
