import { nativeHost } from "./native-host"
import type { Part } from "./primitive-types"

const parts = new WeakMap<object, Part>()

// Focus is requested, never observed: an element reads as active only in the
// task that requested it, so shared code doesn't ask again.
const ownerDocument: { activeElement: object | null; body: null } = {
  activeElement: null,
  body: null,
}

/**
 * What a native behavior file hands shared code in place of a part's
 * element, like a toggle joining its group. Focusing it asks the host to
 * focus the part, the order twin sorts it by where the host renders it, and
 * its box is the part's view's on screen.
 */
function nativeElement(part: Part) {
  const el = {
    focus() {
      ownerDocument.activeElement = el
      queueMicrotask(() => (ownerDocument.activeElement = null))
      nativeHost()?.focus(part)
    },
    getBoundingClientRect() {
      const {
        left = 0,
        top = 0,
        width = 0,
        height = 0,
      } = nativeHost()?.box(part) ?? {}
      return {
        left,
        top,
        width,
        height,
        x: left,
        y: top,
        right: left + width,
        bottom: top + height,
      }
    },
    // Shared code hears focus on an item's element, which the native host never reports.
    addEventListener() {},
    removeEventListener() {},
    ownerDocument,
  }
  parts.set(el, part)
  return el as unknown as HTMLElement
}

/** The part a stand-in from `nativeElement` stands for. */
const partOf = (node: Node) => parts.get(node)

export { nativeElement, partOf }
