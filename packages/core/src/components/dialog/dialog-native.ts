// PROTOTYPE (issue #14). Dialog's and Alert Dialog's behavior on the native
// host: a popup's, with focus starting on an alert dialog's close button, as
// its least destructive action does on the DOM host.
import { popupNative } from "../../foundation/popups/popup-native"
import type { DialogApi } from "./dialog-api"

/**
 * What the native adapter attaches to `dialog` and `alertDialog`.
 * @experimental
 */
const dialogNative = popupNative({
  focusSlot: (internal) =>
    (internal as DialogApi["internal"]).alert ? "close" : "content",
})

export { dialogNative }
