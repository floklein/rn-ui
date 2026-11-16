import { nativeElement } from "../../foundation/kernel/native-element"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import type { ToggleApi } from "./toggle"

/**
 * Toggle's behavior on the native host. While its root is mounted it joins
 * its group, as its `bind` does on the DOM host, so the group knows its
 * toggles in render order, refuses a disabled one and can focus one.
 * @experimental
 */
const toggleNative: NativeBehavior<ToggleApi> = {
  root: (part) => part.api.internal.join(nativeElement(part)),
}

export { toggleNative }
