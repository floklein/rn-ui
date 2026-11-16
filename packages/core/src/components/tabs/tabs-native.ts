import { nativeElement } from "../../foundation/kernel/native-element"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import type { TabsApi } from "./tabs"

/**
 * Tabs' behavior on the native host. While a tab is mounted it joins the
 * tabs' roving group, as its `bind` does on the DOM host, so the tabs know
 * their tabs in render order, select the first enabled one when nothing is
 * selected, and focus the selected one.
 * @experimental
 */
const tabsNative: NativeBehavior<TabsApi> = {
  tab: (part) => part.api.internal.roving.bind(nativeElement(part), part),
}

export { tabsNative }
