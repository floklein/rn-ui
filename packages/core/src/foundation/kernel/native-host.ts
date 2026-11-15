import type { Part } from "./primitive-types"

/**
 * What core asks of the native host, which `@ui-sdk/react-native`
 * implements with `react-native` views and registers as it loads.
 * @experimental
 */
type NativeHost = {
  /** Requests accessibility focus on the part's mounted view, and input focus for a text input. Does nothing when the part has no view. */
  focus: (part: Part) => void
}

let host: NativeHost | undefined

/**
 * Registers the native host core's native code asks, or clears it with
 * `undefined`. The native adapter calls it once, as it loads.
 * @experimental
 */
function setNativeHost(next: NativeHost | undefined) {
  host = next
}

const nativeHost = () => host

export { type NativeHost, nativeHost, setNativeHost }
