import type { Part } from "@ui-sdk/core"
import { type NativeTextField, setNativeHost } from "@ui-sdk/core/native"
import { AccessibilityInfo, type HostInstance } from "react-native"

const views: WeakMap<Part, HostInstance> = new WeakMap()
const textInputs: WeakSet<HostInstance> = new WeakSet()
const fields: WeakMap<object, NativeTextField> = new WeakMap()

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

setNativeHost({
  focus(part) {
    const view = views.get(part)
    if (view) {
      if (textInputs.has(view)) {
        view.focus()
      }
      AccessibilityInfo.sendAccessibilityEvent(view, "focus")
    }
  },
  field: (part) => fields.get(part.api),
  announce(text, priority) {
    AccessibilityInfo.announceForAccessibilityWithOptions(text, {
      queue: priority === "polite",
    })
  },
})

export { fields, pressSource, textInputs, views }
