import type { Part } from "@ui-sdk/core"
import { setNativeHost } from "@ui-sdk/core/native"
import { AccessibilityInfo, type HostInstance } from "react-native"

const views: WeakMap<Part, HostInstance> = new WeakMap()
const renders: WeakMap<Part, number> = new WeakMap()

// `onPress` doesn't say who pressed, so a press while a screen reader runs is
// taken as the screen reader's.
let screenReader = false
AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
  screenReader = enabled
})
AccessibilityInfo.addEventListener("screenReaderChanged", (enabled) => {
  screenReader = enabled
})
const pressSource = () => (screenReader ? "virtual" : "touch")

const following = 4

setNativeHost({
  focus(part) {
    const view = views.get(part)
    if (view) {
      AccessibilityInfo.sendAccessibilityEvent(view, "focus")
    }
  },
  announce(text, priority) {
    AccessibilityInfo.announceForAccessibilityWithOptions(text, {
      queue: priority === "polite",
    })
  },
  // The view tree keeps render order even for a part that rendered alone,
  // like one inserted between memoized siblings. A test renderer's views
  // can't compare, so there it's the order parts last rendered in.
  compare(a, b) {
    const first = views.get(a)
    const second = views.get(b)
    if (first?.compareDocumentPosition && second) {
      return first.compareDocumentPosition(second) & following ? -1 : 1
    }
    return (renders.get(a) ?? 0) - (renders.get(b) ?? 0)
  },
})

export { pressSource, renders, views }
