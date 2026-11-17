import { nativeElement } from "../kernel/native-element"
import { nativeHost } from "../kernel/native-host"
import type { Part } from "../kernel/primitive-types"
import type { Store } from "../kernel/store"
import type { Listbox } from "./listbox"

/**
 * What the listbox engine registers for a mounted option on the native host,
 * in place of its element: connected while it's mounted, sorted by where the
 * host renders it, and focused through the host. Its label comes from its
 * props, which the adapter fills from its text.
 */
function nativeItem(part: Part) {
  return Object.assign(nativeElement(part), {
    isConnected: true,
    getAttribute: () => null,
  })
}

/**
 * Has the screen reader say the highlighted option while focus stays in a
 * search field, where the web points `aria-activedescendant` at it. A
 * highlight set while `quiet()` is true, like the one opening sets, isn't said.
 */
function announceHighlight(
  store: Store<{ highlighted: string | null; open: boolean }>,
  listbox: Listbox,
  { virtual, quiet }: { virtual: () => boolean; quiet: () => boolean }
) {
  let last = store.get().highlighted
  return store.subscribe(() => {
    const { highlighted, open } = store.get()
    if (highlighted === last) {
      return
    }
    last = highlighted
    if (quiet() || !open || highlighted === null || !virtual()) {
      return
    }
    const label = listbox.labelOf(highlighted)
    if (label) {
      nativeHost()?.announce(label, "polite")
    }
  })
}

export { announceHighlight, nativeItem }
