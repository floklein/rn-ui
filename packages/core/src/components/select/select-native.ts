import {
  flagWhileBound,
  keyWhileBound,
  settleFlag,
} from "../../foundation/kernel/bound-keys"
import { type ChangeSource, withSource } from "../../foundation/kernel/details"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import type { Part } from "../../foundation/kernel/primitive-types"
import { bindItem } from "../../foundation/lists/listbox-parts"
import {
  announceHighlight,
  nativeItem,
} from "../../foundation/lists/listbox-native"
import {
  openerBySource,
  partIn,
  popupNative,
} from "../../foundation/popups/popup-native"
import type { SelectApi } from "./select-api"

// The highlight opening sets isn't announced: focus moving says it.
let opening = false

// `any`: Select's own `internal.hover` clashes with the popup's hover feature.
const popup: NativeBehavior<SelectApi> = popupNative<any>({
  focus(api: SelectApi, plan: string) {
    const internal = api.internal as unknown as Parameters<typeof partIn>[0]
    const content = partIn(internal, "content")
    if (plan === "popup") {
      return content
    }
    opening = true
    let target: HTMLElement | undefined
    try {
      target = api.internal.initialFocus()
    } finally {
      opening = false
    }
    const highlighted = api.internal.store.get().highlighted
    const item =
      target && highlighted !== null
        ? partIn(internal, "item", highlighted)
        : undefined
    return item ?? partIn(internal, "input") ?? content
  },
})

/**
 * Presses a select's trigger from the native host: opens the list, with the
 * opener its source stands for, or closes it.
 * @experimental
 */
function pressSelectTrigger(part: Part<any, SelectApi>, source: ChangeSource) {
  const { api, props, store } = part
  if (props.disabled) {
    return
  }
  withSource(source, () =>
    store.get().open
      ? api.internal.hide({ reason: "trigger-press" })
      : api.internal.show({
          by: openerBySource[source] ?? "imperative",
          reason: "trigger-press",
        })
  )
}

/**
 * Select's behavior on the native host: a popup's layer, back, escape and
 * outside press, focus on the selected item as it opens and back to the
 * trigger as it closes. Each option registers with the listbox engine while
 * it's mounted, so the list knows its options in render order. While focus
 * stays in a search field, the highlighted option is announced.
 * @experimental
 */
const selectNative: NativeBehavior<SelectApi> = {
  trigger(part) {
    settleFlag(part.store, "labeled")
    return popup.trigger!(part)
  },
  label: (part) => flagWhileBound(part.store, "labeled"),
  content(part) {
    const { store, api } = part
    const unannounce = announceHighlight(store, api.internal.listbox, {
      virtual: () => store.get().searchable && !store.get().focusInList,
      quiet: () => opening,
    })
    let active = true
    queueMicrotask(() => active && store.set({ settled: true }))
    const unbind = popup.content!(part)
    return () => {
      active = false
      unannounce()
      unbind?.()
      store.set({ settled: false })
    }
  },
  list: (part) => flagWhileBound(part.store, "listed"),
  input: (part) => flagWhileBound(part.store, "searchable", { now: true }),
  item: (part) => bindItem(nativeItem(part), part),
  "select-all": (part) =>
    part.api.internal.listbox.register(part.key, nativeItem(part), () => ({
      value: part.key,
      label: "",
      pinned: true,
    })),
  "group-label": (part) =>
    keyWhileBound(part.store, "groupLabels", part.props.group),
  "item-icon": (part) =>
    part.props.item === undefined
      ? undefined
      : // The adapter renders the part's own children where the value shows it.
        part.api.internal.icons.register(
          part.props.item,
          part as unknown as Element
        ),
}

export { pressSelectTrigger, selectNative }
