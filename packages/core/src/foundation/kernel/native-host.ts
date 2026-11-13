// PROTOTYPE (issue #14). What core asks of the native host, where a part is a
// React Native view. The native adapter implements `NativeHost` and registers
// it once. Core never imports `react-native`.
import type { Part } from "./primitive-types"

/**
 * What dismisses the topmost layer on the native host. Each says whether a
 * layer took it, so the host can let the platform have it otherwise.
 * @experimental
 */
type NativeInput = {
  /** Android's back button or gesture. */
  back: () => boolean
  /** The screen reader's escape gesture, on iOS. */
  escape: () => boolean
  /** A press on a modal popup's backdrop. */
  outsidePress: () => boolean
}

/**
 * The native host, which the native adapter implements with `react-native`.
 * @experimental
 */
type NativeHost = {
  /** Requests accessibility focus on a part's view, and input focus for a text input. Never observed. */
  focus: (part: Part) => void
  /** Hears what dismisses a layer while one is open. Returns what stops it. */
  listen: (input: NativeInput) => () => void
}

/**
 * A component's behavior on the native host, which the native adapter
 * attaches: `attach` while the instance is kept, and a slot's function while
 * that part's view is mounted, as `bind` is on the DOM host.
 * @experimental
 */
type NativeBehavior<Instance = never> = {
  /** Runs while the framework keeps the instance. Returns its cleanup. */
  attach?: (instance: Instance, host: NativeHost) => (() => void) | void
  /** Runs while a part of the slot is mounted. Returns its cleanup. */
  slots?: Record<string, (part: Part, host: NativeHost) => (() => void) | void>
}

let host: NativeHost | undefined

/**
 * Registers the native host. The native adapter calls it once, as it loads.
 * @experimental
 */
function setNativeHost(next: NativeHost) {
  host = next
}

const nativeHost = () => host

// The part of `slot` with `key`, or the first part of the slot without one.
function partIn(parts: Iterable<Part>, slot: string, key?: string | null) {
  let first: Part | undefined
  for (const part of parts) {
    if (part.slot !== slot) {
      continue
    }
    if (key == null || part.key === key) {
      return part
    }
    first ??= part
  }
  return first
}

export {
  type NativeBehavior,
  type NativeHost,
  nativeHost,
  type NativeInput,
  partIn,
  setNativeHost,
}
