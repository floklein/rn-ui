import { nativeElement } from "../../foundation/kernel/native-element"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import type { RatingApi } from "./rating"

/**
 * Rating's behavior on the native host. While a radio is mounted it joins
 * the rating's roving group, as its `bind` does on the DOM host, so the
 * rating knows its radios in render order and focuses the checked one.
 * @experimental
 */
const ratingNative: NativeBehavior<RatingApi> = {
  radio: (part) => part.api.internal.roving.bind(nativeElement(part), part),
}

export { ratingNative }
