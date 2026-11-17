import { elements } from "../../foundation/kernel/elements"
import type {
  Part,
  PrimitiveContext,
} from "../../foundation/kernel/primitive-types"
import type { TextSelection } from "../../foundation/text/corrected-edit"
import type { SharedOptions, State } from "./date-input-api"
import type { DateInputSegmentData, EditableType } from "./date-input-model"

type NativeFieldContext = {
  store: PrimitiveContext<SharedOptions, State, string>["store"]
  segmentElement: (type: EditableType) => HTMLElement | undefined
  insert: (type: EditableType, el: HTMLElement, text: string) => void
  remove: (type: EditableType, el: HTMLElement, backward: boolean) => void
  /** Sets the value from pasted text. Returns false when it isn't one. */
  pasteText: (text: string) => boolean
  /** Steps a segment as a key does, like `"ArrowUp"`. */
  step: (type: EditableType, key: string) => void
  blur: () => void
}

type NativeField = {
  /** Takes a segment's whole text after an edit, and writes it back with its selection when nothing in it was taken. */
  typeText: (type: EditableType, text: string) => void
  /** Takes the key a segment reports: Backspace in an empty segment goes back. */
  pressKey: (type: EditableType, key: string) => void
  /** Takes the selection a segment reports. */
  selectText: (type: EditableType, selection: TextSelection) => void
  /** Takes a segment losing focus, which keeps the digits typed so far. */
  leaveText: (type: EditableType) => void
  /** A screen reader's increment or decrement on a segment, which steps it as the arrow keys do. */
  adjust: (type: EditableType, direction: 1 | -1) => void
  /** Lists a segment while its view is mounted. Returns what unlists it. */
  mountSegment: (part: Part) => () => void
}

type SegmentProps = { segment?: Pick<DateInputSegmentData, "key"> }

/** The segments' elements, in the order they show. */
const segmentElements = (context: { parts(): Iterable<Part> }) =>
  elements<SegmentProps>(context, "segment")

/**
 * What a native segment's text field reports, as api methods. Empty on the
 * web, where `bind` and the `on` handlers read the inputs; its native twin
 * has them.
 */
function nativeField(_context: NativeFieldContext) {
  return {} as NativeField
}

export {
  nativeField,
  type NativeField,
  type NativeFieldContext,
  segmentElements,
  type SegmentProps,
}
