import { dateInput, type DateInputOptions } from "@ui-sdk/core/date-input"
import { dateInputNative } from "@ui-sdk/core/native"
import {
  type RootProps,
  type SegmentProps,
  useSegment,
  useSegmentedRoot,
} from "./segmented-input"
import { usePrimitive } from "./use-primitive"

/**
 * The root: a group of segments the locale orders, like month, day and year.
 * Without children it renders every segment; its children can be a function
 * of its state that renders `state.segments`. It takes part in no form, so
 * it has no hidden input and no `name`.
 * @experimental
 */
function DateInput({
  value,
  defaultValue,
  onValueChange,
  granularity,
  hourCycle,
  min,
  max,
  unavailable,
  locale,
  disabled,
  readOnly,
  required,
  controller,
  debug,
  ...props
}: Omit<DateInputOptions, "name" | "form"> & RootProps) {
  const handle = usePrimitive(
    dateInput,
    {
      value,
      defaultValue,
      onValueChange,
      granularity,
      hourCycle,
      min,
      max,
      unavailable,
      locale,
      disabled,
      readOnly,
      required,
      controller,
      debug,
    },
    dateInputNative
  )
  return useSegmentedRoot(handle, props, DateInputSegment)
}

/**
 * A segment, like the month: a `TextInput` with a number pad that digits
 * fill, named by its unit. Focus moves on once it's complete, and Backspace
 * in an empty one goes back. The text between segments renders as a `Text`.
 * @experimental
 */
function DateInputSegment(props: SegmentProps) {
  return useSegment(dateInput, props)
}

export { createDateInputController } from "@ui-sdk/core/date-input"
export type {
  DateInputApi,
  DateInputChangeOptions,
  DateInputController,
  DateInputGranularity,
  DateInputOptions,
  DateInputPrimitive,
  DateInputSegmentData,
  DateInputSegmentProps,
  DateInputSegmentState,
  DateInputSegmentType,
  DateInputState,
  DateInputValueChangeReason,
  DateMatcher,
  DateMatchers,
  HourCycle,
} from "@ui-sdk/core/date-input"

export { DateInput, DateInputSegment }
