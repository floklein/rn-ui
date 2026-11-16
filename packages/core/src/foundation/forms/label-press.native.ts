import { nativeHost } from "../kernel/native-host"
import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./label-press"
import type * as Native from "./label-press.native"

function pressLabel(
  part: {
    el: HTMLElement | undefined
    api: { activate: (event?: Event) => void; disabled: () => boolean }
  },
  _event?: Event
) {
  if (!part.api.disabled()) {
    nativeHost()?.activate(part)
  }
}

true satisfies Twin<typeof Mirrored, typeof Native>

export { pressLabel }
