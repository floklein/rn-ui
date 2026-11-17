import { nativeElement } from "../../foundation/kernel/native-element"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import { onSettled } from "../../foundation/motion/presence-native"
import type { AccordionApi } from "./accordion"

/**
 * Accordion's behavior on the native host. While an item is mounted it
 * registers, as its `bind` does on the DOM host, so the accordion knows its
 * items in render order. A panel settles when the adapter's presence does,
 * as Collapsible's does.
 * @experimental
 */
const accordionNative: NativeBehavior<AccordionApi> = {
  // The items' order sorts the items whose element is connected; a mounted one is.
  item: (part) =>
    part.api.internal.registerItem(
      part.key,
      Object.assign(nativeElement(part), { isConnected: true })
    ),
  panel(part) {
    const { api, key } = part
    // A panel rendered only once open mounts shown, so no enter follows.
    let entered = api.isOpen(key) && api.internal.opening(key) !== "mount"
    if (entered) {
      api.internal.settled(key, true)
    }
    onSettled(part, (open) => {
      if (!(open && entered)) {
        api.internal.settled(key, open)
      }
      entered = false
    })
  },
}

export { accordionNative }
