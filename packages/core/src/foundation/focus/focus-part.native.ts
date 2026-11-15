import { nativeHost } from "../kernel/native-host"
import type { Part } from "../kernel/primitive-types"
import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./focus-part"
import type * as Native from "./focus-part.native"

function focusPart(
  _element: () => HTMLElement | undefined,
  parts: () => Iterable<Part>,
  slot: string,
  key?: string | null
) {
  for (const part of parts()) {
    if (part.slot === slot && (key == null || part.key === key)) {
      nativeHost()?.focus(part)
      return
    }
  }
}

true satisfies Twin<typeof Mirrored, typeof Native>

export { focusPart }
