import { nativeHost } from "../kernel/native-host"
import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./env"
import type * as Native from "./env.native"

const isBrowser = false

function isIOS() {
  return false
}

// One direction for the whole app, so the element is never read.
function isRTL(_el: Element | null | undefined) {
  return !!nativeHost()?.isRTL()
}

true satisfies Twin<typeof Mirrored, typeof Native, "isBrowser">

export { isBrowser, isIOS, isRTL }
