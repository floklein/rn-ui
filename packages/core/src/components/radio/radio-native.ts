import { nativeElement } from "../../foundation/kernel/native-element"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import type { RadioGroupApi } from "./radio-api"

/**
 * Radio's behavior on the native host. While a radio is mounted it joins its
 * group's roving group, as its `bind` does on the DOM host, so the group
 * knows its radios in render order and focuses the checked one.
 * @experimental
 */
const radioNative: NativeBehavior<RadioGroupApi> = {
  root: (part) => part.api.internal.roving.bind(nativeElement(part), part),
}

export { radioNative }
