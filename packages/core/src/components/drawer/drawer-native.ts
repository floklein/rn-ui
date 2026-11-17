import { nativeElement } from "../../foundation/kernel/native-element"
import {
  type NativeBehavior,
  nativeHost,
} from "../../foundation/kernel/native-host"
import { partIn, popupNative } from "../../foundation/popups/popup-native"
import type { DrawerApi } from "./drawer-api"

const popup = popupNative<DrawerApi>({
  focus({ internal }) {
    if (internal.contentProps().initialFocus === "content") {
      return partIn(internal, "content")
    }
    return partIn(internal, "title") || partIn(internal, "content")
  },
  escape({ internal }, inside) {
    if (internal.store.get().modal === false && !inside) {
      return
    }
    internal.hide({ reason: "escape-key" })
  },
})

/**
 * Drawer's behavior on the native host: Dialog's, with the sheet attached to
 * the content before its layer shows, and the handle stepping through the
 * snap points on a screen reader's increment and decrement.
 * @experimental
 */
const drawerNative: NativeBehavior<DrawerApi> = {
  ...popup,
  content(part) {
    const { internal } = part.api
    const el = nativeElement(part)
    internal.attach(el, el, internal.backdropElement)
    const unbind = popup.content!(part)
    return () => {
      unbind?.()
      internal.detach()
    }
  },
  handle: (part) =>
    nativeHost()?.adjustable(part, (direction) =>
      part.api.internal.stepHandle(
        direction > 0 ? "expand" : "collapse",
        "handle-key"
      )
    ),
}

export { drawerNative }
