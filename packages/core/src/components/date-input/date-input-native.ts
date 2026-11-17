import { nativeElement } from "../../foundation/kernel/native-element"
import {
  type NativeBehavior,
  nativeHost,
} from "../../foundation/kernel/native-host"
import type { Part } from "../../foundation/kernel/primitive-types"
import type { DateInputApi, State } from "./date-input-api"
import type { DateInputSegmentProps } from "./date-input-parts"
import type { EditableType } from "./date-input-model"

type SegmentPart = Part<State, DateInputApi, DateInputSegmentProps>

/**
 * Date Input's and Time Input's behavior on the native host, as their `bind`
 * does on the DOM host: the root reads the locale, and each segment you type
 * in is listed, so typing moves on to the next one, and steps when a screen
 * reader adjusts it.
 * @experimental
 */
const dateInputNative: NativeBehavior<DateInputApi> = {
  root: (part) => part.api.internal.bindRoot(nativeElement(part)),
  segment(part: SegmentPart) {
    const { segment } = part.props
    if (!segment?.editable) {
      return
    }
    const type = segment.type as EditableType
    const { internal } = part.api
    const unmount = internal.mountSegment(part)
    const unadjust = nativeHost()?.adjustable(part, (direction) =>
      internal.adjust(type, direction)
    )
    return () => {
      unmount()
      unadjust?.()
    }
  },
}

export { dateInputNative }
