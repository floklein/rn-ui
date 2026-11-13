// PROTOTYPE (issue #14). The native twin of `focus-part.ts`.
import { nativeHost, partIn } from "../kernel/native-host"
import type { Part } from "../kernel/primitive-types"

function focusPart(
  _element: () => HTMLElement | undefined,
  parts: () => Iterable<Part>,
  slot: string,
  key?: string | null
) {
  const part = partIn(parts(), slot, key)
  if (part) {
    nativeHost()?.focus(part)
  }
}

export { focusPart }
