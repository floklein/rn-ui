import { type ChangeSource, resolveSource } from "./details"
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
 * Where a touch is, in the coordinates `box` measures in, and the innermost
 * mounted part under it.
 * @experimental
 */
type NativeTouch = { x: number; y: number; target: Part | undefined }

/**
 * What a touch drag on a part's view does, as the web's pointer handlers do.
 * @experimental
 */
type NativeDrag = {
  /** Whether a touch starting now takes the responder. */
  accepts: () => boolean
  start: (touch: NativeTouch) => void
  move: (touch: NativeTouch) => void
  /** The touch lifted. */
  end: () => void
  /** The touch was cancelled or taken by another view, like a scroll view. */
  cancel: () => void
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
 * What an agent reads of a rendered part: what a screen reader reads of its
 * view, the marks around it and its press.
 * @experimental
 */
type NativeSeen = {
  /** Its accessibility label. */
  label?: string
  /** The plain text inside it, as a screen reader reads it. */
  text?: string
  /** Its accessibility role, like `"button"`. */
  role?: string
  /** Whether it reads as disabled. */
  disabled: boolean
  /** Hidden from accessibility, by itself, a part around it or an open modal it isn't in. */
  hidden: boolean
  /** Inside `data-agent-hidden`. */
  offLimits: boolean
  /** Inside `data-agent-secret`, or a password, card or one-time-code field. */
  secret: boolean
  /** The `data-agent-confirm` text around it. */
  confirm?: string
  /** The ids of the instances whose parts it renders inside, outermost first. */
  within: readonly string[]
  /** Presses it as its view's press does, when it takes one. */
  press?: () => void
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
  /** Whether the app lays out right to left. */
  isRTL: () => boolean
  /** The box of the part's mounted view on screen, or `undefined`. */
  box: (
    part: Part
  ) => { left: number; top: number; width: number; height: number } | undefined
  /** Follows the touches that start on the part's view with `drag`, until the cleanup it returns runs. */
  follow: (part: Part, drag: NativeDrag) => () => void
  /** Routes a screen reader's increment and decrement on the part's view to `step`, until the cleanup it returns runs. */
  adjustable: (part: Part, step: (direction: 1 | -1) => void) => () => void
  /** Hears what dismisses a layer while one is open. Returns what stops it. */
  listen: (input: NativeInput) => () => void
  /** What an agent reads of the part, or `undefined` while it renders no view. */
  seen: (part: Part) => NativeSeen | undefined
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

/**
 * The source of a press the native host delivers, from how the person
 * pressed: `"agent"` instead while the agent bridge presses, so the changes it
 * causes report the agent.
 * @experimental
 */
const nativePressSource = (source: ChangeSource) =>
  resolveSource("press", () => source)

export {
  type NativeBehavior,
  type NativeDrag,
  type NativeHost,
  nativeHost,
  type NativeInput,
  nativePressSource,
  type NativeSeen,
  type NativeTextField,
  type NativeTouch,
  setNativeHost,
}
