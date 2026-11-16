import { nativeElement } from "../../foundation/kernel/native-element"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import type { CheckboxApi } from "./checkbox"

/**
 * Checkbox's behavior on the native host. While its root is mounted it joins
 * its group, as its `bind` does on the DOM host, so the group knows its
 * checkboxes in render order and can focus one.
 * @experimental
 */
const checkboxNative: NativeBehavior<CheckboxApi> = {
  // The group skips a checkbox whose element isn't connected; a mounted one is.
  root: (part) =>
    part.api.internal.joinGroup(
      Object.assign(nativeElement(part), { isConnected: true })
    ),
}

export { checkboxNative }
