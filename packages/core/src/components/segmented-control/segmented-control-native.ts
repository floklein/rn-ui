import { nativeElement } from "../../foundation/kernel/native-element"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import type { SegmentedControlApi } from "./segmented-control"

/**
 * Segmented Control's behavior on the native host. While an item is mounted
 * it joins the control's roving group, as its `bind` does on the DOM host, so
 * the control knows its items in render order and focuses the checked one.
 * @experimental
 */
const segmentedControlNative: NativeBehavior<SegmentedControlApi> = {
  item: (part) => part.api.internal.roving.bind(nativeElement(part), part),
}

export { segmentedControlNative }
