import type { Part } from "./primitive-types"

/**
 * A text field as a part around it reaches it: a Clear part empties it, and
 * a press around it starts editing it.
 * @experimental
 */
type NativeTextField = {
  /** Starts editing the field. */
  focus: () => void
  internal: {
    /** Empties the field with the `"clear-press"` reason. */
    clearPress: (event?: Event) => void
  }
}

/**
 * What dismisses the topmost open layer on the native host. Each says
 * whether a layer took it, so the host can leave it to the OS otherwise.
 * @experimental
 */
type NativeInput = {
  /** Android's back button or gesture. */
  back: () => boolean
  /** The screen reader's escape gesture on iOS, with the api of the popup whose content it reached, when it reached one. */
  escape: (within?: object) => boolean
  /** A press on a modal popup's backdrop. */
  outsidePress: () => boolean
  /** A press the host lets through, with the api of each popup whose content or trigger it landed in. */
  press: (within: readonly object[]) => boolean
}

/**
 * What core asks of the native host, which `@ui-sdk/react-native`
 * implements with `react-native` views and registers as it loads.
 * @experimental
 */
type NativeHost = {
  /** Requests accessibility focus on the part's mounted view, and input focus for a text input. Does nothing when the part has no view. */
  focus: (part: Part) => void
  /** The text field rendered inside the part's view, like the Input in an InputGroup, or `undefined`. */
  field: (part: Part) => NativeTextField | undefined
  /** Has the screen reader say `text`. On iOS, `"polite"` waits for what VoiceOver is saying and `"assertive"` interrupts it. */
  announce: (text: string, priority: "polite" | "assertive") => void
  /** Activates the control that joined the Field of `part`, as a press on its label does: starts editing a text field, and presses any other control. */
  activate: (part: { api: object }) => void
  /** Where two mounted parts render: negative when `a` comes first, positive when `b` does. */
  compare: (a: Part, b: Part) => number
  /** Hears what dismisses a layer while one is open. Returns what stops it. */
  listen: (input: NativeInput) => () => void
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

export {
  type NativeBehavior,
  type NativeHost,
  nativeHost,
  type NativeInput,
  type NativeTextField,
  setNativeHost,
}
