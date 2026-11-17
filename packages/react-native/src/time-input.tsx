import { dateInputNative } from "@ui-sdk/core/native"
import { timeInput, type TimeInputOptions } from "@ui-sdk/core/time-input"
import {
  type RootProps,
  type Segmented,
  type SegmentProps,
  useSegment,
  useSegmentedRoot,
} from "./segmented-input"
import { type PrimitiveHandle, usePrimitive } from "./use-primitive"

const primitive = timeInput as unknown as Segmented

/**
 * The root: a group of segments, hours and minutes, with seconds and AM/PM
 * when shown. Without children it renders every segment; its children can be
 * a function of its state that renders `state.segments`. It takes part in no
 * form, so it has no hidden input and no `name`.
 * @experimental
 */
function TimeInput({
  value,
  defaultValue,
  onValueChange,
  granularity,
  hourCycle,
  min,
  max,
  locale,
  disabled,
  readOnly,
  required,
  controller,
  debug,
  ...props
}: Omit<TimeInputOptions, "name" | "form"> & RootProps) {
  const handle = usePrimitive(
    timeInput,
    {
      value,
      defaultValue,
      onValueChange,
      granularity,
      hourCycle,
      min,
      max,
      locale,
      disabled,
      readOnly,
      required,
      controller,
      debug,
    },
    dateInputNative
  )
  return useSegmentedRoot(
    handle as unknown as PrimitiveHandle<Segmented>,
    props,
    TimeInputSegment
  )
}

/**
 * A segment, like the hour: a `TextInput` with a number pad that digits
 * fill, named by its unit. Focus moves on once it's complete, and Backspace
 * in an empty one goes back. The text between segments renders as a `Text`.
 * @experimental
 */
function TimeInputSegment(props: SegmentProps) {
  return useSegment(primitive, props)
}

export { createTimeInputController } from "@ui-sdk/core/time-input"
export type {
  HourCycle,
  TimeInputApi,
  TimeInputChangeOptions,
  TimeInputController,
  TimeInputGranularity,
  TimeInputOptions,
  TimeInputPrimitive,
  TimeInputSegmentData,
  TimeInputSegmentProps,
  TimeInputSegmentState,
  TimeInputSegmentType,
  TimeInputState,
  TimeInputValueChangeReason,
} from "@ui-sdk/core/time-input"

export { TimeInput, TimeInputSegment }
