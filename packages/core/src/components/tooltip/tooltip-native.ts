import {
  type NativeBehavior,
  nativeHost,
} from "../../foundation/kernel/native-host"
import { partIn, popupNative } from "../../foundation/popups/popup-native"
import type { TooltipApi } from "./tooltip"

// The screen reader reaches a tooltip's text by swiping, so the escape
// gesture there closes it and takes the screen reader back to its trigger.
const popup = popupNative<TooltipApi>({
  escape({ internal }, inside) {
    const key = internal.store.get().trigger ?? undefined
    internal.popup.requestClose("escape-key")
    const trigger = partIn(internal, internal.triggerSlot, key)
    if (inside && trigger && !internal.store.get().open) {
      nativeHost()?.focus(trigger)
    }
  },
})

/**
 * Tooltip's behavior on the native host: a popup's, which never takes focus,
 * whose content joins the warm group while it's mounted, so the next tooltip
 * opens at once.
 * @experimental
 */
const tooltipNative: NativeBehavior<TooltipApi> = {
  ...popup,
  content(part) {
    part.api.internal.group?.join()
    return popup.content!(part)
  },
}

export { tooltipNative }
