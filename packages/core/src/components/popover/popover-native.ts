import { partIn, popupNative } from "../../foundation/popups/popup-native"
import type { PopoverApi } from "./popover"

/**
 * Popover's behavior on the native host: a popup's, whose focus on open goes
 * to its title, where the DOM host picks the first focusable element, and to
 * the popover itself after a touch or with `initialFocus="content"`.
 * @experimental
 */
const popoverNative = popupNative<PopoverApi>({
  focus({ internal }, plan) {
    const content = partIn(internal, "content")
    if (
      plan === "popup" ||
      internal.contentProps().initialFocus === "content"
    ) {
      return content
    }
    return partIn(internal, "title") ?? content
  },
})

export { popoverNative }
