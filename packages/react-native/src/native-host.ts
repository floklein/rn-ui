// PROTOTYPE (issue #14). The native host core's native behavior is written
// against, implemented with `react-native`, and registered as this loads.
import type { Part } from "@ui-sdk/core"
import {
  setNativeHost,
  type NativeHost,
  type NativeInput,
} from "@ui-sdk/core/native"
import { AccessibilityInfo, BackHandler, type HostInstance } from "react-native"

const views = new WeakMap<Part, HostInstance>()
const inputs: NativeInput[] = []

// What the host was asked, for the prototype's playground to show: React
// Native reports neither where the screen reader's cursor is nor a back press
// a `Modal` took.
type HostRequest =
  | { type: "focus"; slot: string; key: string; mounted: boolean }
  | { type: "input"; input: keyof NativeInput; taken: boolean }
  | { type: "listen"; listening: boolean }
const tracers = new Set<(request: HostRequest) => void>()
const trace = (request: HostRequest) =>
  tracers.forEach((tracer) => tracer(request))

function traceHost(tracer: (request: HostRequest) => void) {
  tracers.add(tracer)
  return () => {
    tracers.delete(tracer)
  }
}

// What dismisses the topmost layer, from wherever React Native reports it: a
// `Modal`'s `onRequestClose`, the escape gesture or a backdrop's press.
function deliver(input: keyof NativeInput) {
  const taken = inputs.at(-1)?.[input]() ?? false
  trace({ type: "input", input, taken })
  return taken
}

const host: NativeHost = {
  focus(part) {
    const view = views.get(part)
    trace({ type: "focus", slot: part.slot, key: part.key, mounted: !!view })
    if (view) {
      AccessibilityInfo.sendAccessibilityEvent(view, "focus")
    }
  },
  listen(input) {
    inputs.push(input)
    trace({ type: "listen", listening: true })
    // Outside a `Modal`. Inside one, Android sends back to `onRequestClose`.
    const subscription = BackHandler.addEventListener("hardwareBackPress", () =>
      deliver("back")
    )
    return () => {
      subscription.remove()
      inputs.splice(inputs.indexOf(input), 1)
      trace({ type: "listen", listening: false })
    }
  },
}

setNativeHost(host)

export { deliver, host, type HostRequest, traceHost, views }
