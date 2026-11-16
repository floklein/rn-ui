import { nativeHost } from "../kernel/native-host"
import type { Part } from "../kernel/primitive-types"
import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./group-field"
import type * as Native from "./group-field.native"

// React Native's responders already keep a press inside the field or a
// button to themselves, so any press that reaches the group focuses the field.
function groupField(
  _element: () => HTMLElement | undefined,
  parts: () => Iterable<Part>,
  slot: string
) {
  const field = () => {
    for (const part of parts()) {
      if (part.slot === slot) {
        return nativeHost()?.field(part)
      }
    }
  }
  return {
    control: () => undefined,
    clear(event?: Event) {
      const target = field()
      target?.internal.clearPress(event)
      target?.focus()
    },
    pressAround: (_event?: Event) => field()?.focus(),
  }
}

true satisfies Twin<typeof Mirrored, typeof Native, "groupField">

export { groupField }
