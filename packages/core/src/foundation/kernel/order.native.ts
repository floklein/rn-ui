import { partOf } from "./native-element"
import { nativeHost } from "./native-host"
import type * as Mirrored from "./order"
import type * as Native from "./order.native"
import type { Twin } from "./twin"

// Entries' elements are stand-ins from `nativeElement`, in the order the host
// renders their parts.
function isAfter(node: Node, later: Node) {
  const part = partOf(node)
  const other = partOf(later)
  return !!part && !!other && (nativeHost()?.compare(part, other) ?? 0) < 0
}

const documentOrder = (a: Node, b: Node) => (isAfter(a, b) ? -1 : 1)

function inDocumentOrder<Entry extends { el: HTMLElement }>(entries: Entry[]) {
  return entries.sort((a, b) => documentOrder(a.el, b.el))
}

// Nothing reports a part that moves without leaving, so each read sorts again.
function createOrder<Entry extends { key: string; el: HTMLElement }>() {
  const entries = new Map<string, Entry>()
  return {
    list(): readonly Entry[] {
      return inDocumentOrder([...entries.values()])
    },
    add(entry: Entry) {
      entries.set(entry.key, entry)
      return () => {
        if (entries.get(entry.key) === entry) {
          entries.delete(entry.key)
        }
      }
    },
    get: (key: string) => entries.get(key),
    size: () => entries.size,
  }
}

true satisfies Twin<typeof Mirrored, typeof Native>

export { createOrder, documentOrder, inDocumentOrder, isAfter }
