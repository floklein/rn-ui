import { nativeElement } from "../../foundation/kernel/native-element"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import type { CalendarApi } from "./calendar"

/**
 * Calendar's behavior on the native host, as its `bind` does on the DOM
 * host: the mounted root reads the locale and today, and each day joins the
 * roving group, so the controller's `focus()` and a press on a day of
 * another month move the screen reader to a day.
 * @experimental
 */
const calendarNative: NativeBehavior<CalendarApi> = {
  root: (part) => part.api.internal.bindRoot(nativeElement(part)),
  day: (part) => part.api.internal.roving.bind(nativeElement(part), part),
}

export { calendarNative }
