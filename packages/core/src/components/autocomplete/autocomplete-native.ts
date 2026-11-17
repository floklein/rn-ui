import {
  flagWhileBound,
  keyWhileBound,
} from "../../foundation/kernel/bound-keys"
import {
  type ChangeSource,
  resolveSource,
  withSource,
} from "../../foundation/kernel/details"
import {
  type NativeBehavior,
  nativeHost,
} from "../../foundation/kernel/native-host"
import type { Part } from "../../foundation/kernel/primitive-types"
import { registerItem } from "../../foundation/lists/listbox-parts"
import {
  announceHighlight,
  nativeItem,
} from "../../foundation/lists/listbox-native"
import {
  openerBySource,
  partIn,
  popupNative,
} from "../../foundation/popups/popup-native"
import type { AutocompleteApi } from "./autocomplete-api"

// A screen reader's press on the trigger moves focus into the list, as a
// touch screen reader's tap does on the web. Opening sets the highlight
// without announcing it, since focus moving says it.
let intoList = false
let opening = false

// `any`: Autocomplete's api keeps its own internals, the popup's under `popupCore`.
const popup: NativeBehavior<AutocompleteApi> = popupNative<any>({
  focus(api: AutocompleteApi) {
    const { store } = api.internal
    opening = true
    try {
      if (intoList) {
        store.set({ focusInList: true })
      }
      api.internal.initialFocus()
    } finally {
      opening = false
    }
    const { highlighted, focusInList } = store.get()
    if (!focusInList) {
      return null
    }
    const internal = api.internal.popupCore
    return (
      (highlighted !== null && partIn(internal, "item", highlighted)) ||
      partIn(internal, "content")
    )
  },
})

/**
 * Hands the field's new text to an autocomplete from the native host.
 * `atEnd` is whether the caret was at the end of the text before, where an
 * insertion completes inline. Returns the selection to write back after an
 * inline completion, the completed rest.
 * @experimental
 */
function typeAutocomplete(api: AutocompleteApi, text: string, atEnd: boolean) {
  const { query } = api.internal.store.get()
  let selection: { start: number; end: number } | undefined
  withSource("keyboard", () =>
    api.internal.typeText(
      text,
      atEnd && text.length > query.length,
      undefined,
      (completed, start) => (selection = { start, end: completed.length })
    )
  )
  return selection
}

/**
 * The field's return key from the native host, as Enter on the web: it
 * chooses the highlighted suggestion, or closes the list and submits the text.
 * @experimental
 */
function submitAutocomplete(api: AutocompleteApi) {
  const { store, options, press, hide } = api.internal
  const { open, highlighted } = store.get()
  withSource("keyboard", () => {
    if (open && highlighted !== null) {
      return press(highlighted)
    }
    if (open) {
      hide({ reason: "input-commit" })
    }
    options().onSubmit?.(store.get().value, {})
  })
}

/**
 * Presses an autocomplete's trigger from the native host: opens the list, with
 * focus moving into it for a screen reader, or closes it.
 * @experimental
 */
function pressAutocompleteTrigger(
  part: Part<any, AutocompleteApi>,
  source: ChangeSource
) {
  const { api, store } = part
  withSource(source, () => {
    if (store.get().open) {
      return api.internal.hide({ reason: "trigger-press" })
    }
    intoList = source === "virtual"
    try {
      api.internal.show({
        by: openerBySource[source] ?? "imperative",
        reason: "trigger-press",
      })
    } finally {
      intoList = false
    }
  })
}

/**
 * Autocomplete's behavior on the native host: the list's layer, back, escape
 * and outside press, focus left in the field as it opens, unless a screen
 * reader's press on the trigger moves it to the first suggestion. Each
 * suggestion registers with the listbox engine while it's mounted. While
 * focus stays in the field, the highlighted suggestion is announced.
 * @experimental
 */
const autocompleteNative: NativeBehavior<AutocompleteApi> = {
  label: (part) => flagWhileBound(part.store, "labeled"),
  content(part) {
    const { store, api } = part
    // A screen reader in the list, choosing or escaping, goes back to the field.
    let open = store.get().open
    const unwatch = store.subscribe(() => {
      if (store.get().open === open) {
        return
      }
      open = store.get().open
      const input = partIn(api.internal.popupCore, "input")
      if (!open && input && resolveSource("item-press") === "virtual") {
        nativeHost()?.focus(input)
      }
    })
    const unannounce = announceHighlight(store, api.internal.listbox, {
      virtual: () => !store.get().focusInList,
      quiet: () => opening,
    })
    let active = true
    queueMicrotask(() => active && store.set({ settled: true }))
    const unbind = popup.content!(part)
    return () => {
      active = false
      unwatch()
      unannounce()
      unbind?.()
      store.set({ settled: false })
    }
  },
  list: (part) => flagWhileBound(part.store, "listed"),
  item: (part) =>
    registerItem(nativeItem(part), {
      api: part.api,
      key: part.key,
      props: part.props,
    }),
  "group-label": (part) =>
    keyWhileBound(part.store, "groupLabels", part.props.group),
}

export {
  autocompleteNative,
  pressAutocompleteTrigger,
  submitAutocomplete,
  typeAutocomplete,
}
