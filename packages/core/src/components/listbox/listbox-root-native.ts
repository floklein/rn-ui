import { keyWhileBound } from "../../foundation/kernel/bound-keys"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import type { Part } from "../../foundation/kernel/primitive-types"
import { nativeItem } from "../../foundation/lists/listbox-native"
import { bindItem } from "../../foundation/lists/listbox-parts"
import type { ListboxApi } from "./listbox-root-api"

/**
 * Listbox's behavior on the native host. Each option registers with the
 * listbox engine while it's mounted, so the list knows its options in render
 * order and focuses the one that holds its tab stop, and a group label names
 * its group while it's mounted.
 * @experimental
 */
const listboxNative: NativeBehavior<ListboxApi> = {
  item: (part) => bindItem(nativeItem(part), part),
  "group-label": (part) =>
    keyWhileBound(part.store, "groupLabels", part.props.group),
  "item-icon": (part) =>
    part.props.item === undefined
      ? undefined
      : part.api.internal.icons.register(
          part.props.item,
          part as unknown as Element
        ),
}

/**
 * Tells a listbox that keyboard focus reached an option or left it, which
 * the native host reports on the option's view, where the web hears focus
 * events on the list.
 * @experimental
 */
function focusListboxItem(part: Part<any, ListboxApi>, focused: boolean) {
  const { api, key, store } = part
  if (focused) {
    api.internal.focused(key)
  } else if (store.get().highlighted === key) {
    store.set({ highlighted: null })
  }
}

export { focusListboxItem, listboxNative }
