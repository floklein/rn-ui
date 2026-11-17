import { keyWhileBound } from "../../foundation/kernel/bound-keys"
import { nativeElement } from "../../foundation/kernel/native-element"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import type { TimelineApi } from "./timeline"

/**
 * Timeline's behavior on the native host. While an event is mounted it joins
 * the timeline's roving group, so the timeline knows its events in render
 * order and its controller can focus one, and a time, title or description
 * names or describes its event, as their `bind`s do on the DOM host.
 * @experimental
 */
const timelineNative: NativeBehavior<TimelineApi> = {
  item: (part) => part.api.internal.roving.bind(nativeElement(part), part),
  time: (part) => keyWhileBound(part.store, "times", part.key),
  title: (part) => keyWhileBound(part.store, "titles", part.key),
  description: (part) => keyWhileBound(part.store, "descriptions", part.key),
}

export { timelineNative }
