import type { NativeDrag } from "../../foundation/kernel/native-host"
import type { PrimitiveContext } from "../../foundation/kernel/primitive-types"
import type { TextSelection } from "../../foundation/text/corrected-edit"
import type {
  NumberInputOptions,
  NumberInputScrubAreaProps,
  NumberInputValueChangeReason,
} from "./number-input"
import type { State } from "./number-input-api"

type NativeFieldContext = {
  store: PrimitiveContext<NumberInputOptions, State, string>["store"]
  /** Takes the field's text, as the web's `input` event does. */
  type: (text: string) => void
  /** Commits what's typed, as leaving the field does. */
  commitText: () => void
  stepBy: (
    steps: number,
    size: "step" | "large" | "small",
    reason: NumberInputValueChangeReason
  ) => boolean
  /** Whether the value can step that way. */
  canStep: (direction: number) => boolean
  /** Reports the value once an interaction ends. */
  commit: () => void
  focus: () => void
}

type NativeField = {
  /** Takes the field's whole text after an edit, and writes it back with its selection when the web would have refused it. */
  typeText: (text: string) => void
  /** Takes the selection the field reports. */
  selectText: (selection: TextSelection) => void
  /** Takes the field gaining or losing focus, which commits what's typed. */
  focusText: (focused: boolean) => void
  /** A press on a step button starts: it steps, then repeats while held. */
  pressStep: (direction: 1 | -1) => void
  /** The press on a step button ends, which commits. */
  releaseStep: () => void
  /** A step button activated without a press, like a screen reader's, steps once and commits. */
  activateStep: (direction: 1 | -1) => void
  /** Sets the device's keyboard, which picks the input mode. */
  setPlatform: (platform: "ios" | "android") => void
  /** What a touch drag on a scrub area does, with the area's props read as it starts. */
  scrubDrag: (
    props: () => Omit<NumberInputScrubAreaProps, "controller">
  ) => NativeDrag
}

/**
 * What a native text field and the parts around it report, as api methods.
 * Empty on the web, where `bind` and the `on` handlers read the elements;
 * its native twin has them.
 */
function nativeField(_context: NativeFieldContext) {
  return {} as NativeField
}

export { nativeField, type NativeField, type NativeFieldContext }
