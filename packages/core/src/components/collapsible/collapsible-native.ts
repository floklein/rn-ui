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
  panel: (part) => onSettled(part, (open) => part.api.internal.settled(open)),
}

export { collapsibleNative }
