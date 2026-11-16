import type { NativeBehavior } from "../../foundation/kernel/native-host"
import { onSettled } from "../../foundation/motion/presence-native"
import type { CollapsibleApi } from "./collapsible"

/**
 * Collapsible's behavior on the native host. Its panel settles when the
 * adapter's presence does, where `bindPanel` waits for the panel's
 * animations on the DOM host: at once on opening, and on closing once
 * `onExit`'s `done` is called, or at once without `onExit`.
 * @experimental
 */
const collapsibleNative: NativeBehavior<CollapsibleApi> = {
  panel(part) {
    const { api } = part
    // A panel rendered only once open mounts shown, so no enter follows.
    let entered = api.isOpen() && api.internal.opening() !== "mount"
    if (entered) {
      api.internal.settled(true)
    }
    onSettled(part, (open) => {
      if (!(open && entered)) {
        api.internal.settled(open)
      }
      entered = false
    })
  },
}

export { collapsibleNative }
