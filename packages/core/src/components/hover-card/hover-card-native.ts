import { popupNative } from "../../foundation/popups/popup-native"
import type { HoverCardApi } from "./hover-card"

/**
 * Hover Card's behavior on the native host: a popup's, which a pointer
 * opens, and whose focus doesn't move on open, as hover never moves it.
 * @experimental
 */
const hoverCardNative = popupNative<HoverCardApi>()

export { hoverCardNative }
