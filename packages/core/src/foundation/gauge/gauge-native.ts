import { nativeElement } from "../kernel/native-element"
import type { NativeBehavior } from "../kernel/native-host"
import type { Part } from "../kernel/primitive-types"
import { bindPageLocale } from "../text/locale"
import type { gaugeApi } from "./gauge"

/**
 * Progress's and Meter's behavior on the native host, as their `bind` does
 * on the DOM host: the mounted root reads the locale it formats in, and a
 * mounted Label names the root.
 * @experimental
 */
const gaugeNative: NativeBehavior<ReturnType<typeof gaugeApi>> = {
  root: (part: Part<{ pageLocale?: string | null }>) =>
    bindPageLocale(nativeElement(part), (pageLocale) =>
      part.store.set({ pageLocale })
    ),
  label: (part) => part.api.internal.label(),
}

export { gaugeNative }
