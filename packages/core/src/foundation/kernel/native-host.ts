import type { Part } from "./primitive-types"

/**
 * What core asks of the native host, which `@ui-sdk/react-native`
 * implements with `react-native` views and registers as it loads.
 * @experimental
 */
type NativeHost = {
  /** Requests accessibility focus on the part's mounted view, and input focus for a text input. Does nothing when the part has no view. */
  focus: (part: Part) => void
  /** Has the screen reader say `text`. On iOS, `"polite"` waits for what VoiceOver is saying and `"assertive"` interrupts it. */
  announce: (text: string, priority: "polite" | "assertive") => void
  /** Where two mounted parts render: negative when `a` comes first, positive when `b` does. */
  compare: (a: Part, b: Part) => number
}

/**
 * A component's behavior on the native host, which the native adapter runs:
 * each slot's function while a part of that slot is mounted, as `bind` runs
 * on the DOM host. A function returns its cleanup.
 * @experimental
 */
type NativeBehavior<Api = any> = {
  [slot: string]: ((part: Part<any, Api>) => (() => void) | void) | undefined
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

/**
 * The native host registered now, or `undefined` before the adapter loads.
 * A check wraps it to see what core asks.
 * @experimental
 */
const nativeHost = () => host

export { type NativeBehavior, type NativeHost, nativeHost, setNativeHost }
