import { nativeHost } from "./native-host"
import type { Part } from "./primitive-types"

const parts = new WeakMap<object, Part>()

/**
 * What a native behavior file hands shared code in place of a part's
 * element, like a toggle joining its group. Focusing it asks the host to
 * focus the part, and the order twin sorts it by where the host renders it.
 */
function nativeElement(part: Part) {
  const el = {
    focus: () => nativeHost()?.focus(part),
    // Shared code hears focus on an item's element, which the native host never reports.
    addEventListener() {},
    removeEventListener() {},
  }
  parts.set(el, part)
  return el as unknown as HTMLElement
}

/** The part a stand-in from `nativeElement` stands for. */
const partOf = (node: Node) => parts.get(node)

export { nativeElement, partOf }
