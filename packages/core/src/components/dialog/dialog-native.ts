import { partIn, popupNative } from "../../foundation/popups/popup-native"
import type { DialogApi } from "./dialog-api"

/**
 * Dialog's and Alert Dialog's behavior on the native host: a popup's, named
 * by its title, which takes focus on open. An alert dialog opened from the
 * keyboard, a screen reader or code starts on its first Close part, its
 * least destructive action, as `"auto"` does on the DOM host. A non-modal
 * dialog closes on the escape gesture only when it reached its content,
 * where the DOM host asks whether focus is inside it.
 * @experimental
 */
const dialogNative = popupNative<DialogApi>({
  focus({ internal }, plan) {
    const setting = internal.contentProps().initialFocus
    if (setting === "content") {
      return partIn(internal, "content")
    }
    const close = internal.alert && plan === "auto" && partIn(internal, "close")
    return close || partIn(internal, "title") || partIn(internal, "content")
  },
  escape({ internal }, inside) {
    if (internal.store.get().modal === false && !inside) {
      return
    }
    internal.hide({ reason: "escape-key" })
  },
})

export { dialogNative }
