import {
  datePicker,
  type DatePickerContentProps,
  type DatePickerContentState,
  type DatePickerHintState,
  type DatePickerInputProps,
  type DatePickerInputState,
  type DatePickerOptions,
  type DatePickerPresetState,
  type DatePickerState,
  type DatePickerTriggerState,
  type DatePickerValue,
} from "@ui-sdk/core/date-picker"
import { datePickerNative, datePickerText } from "@ui-sdk/core/native"
import type { PresenceState } from "@ui-sdk/core/renderer"
import { withSource } from "@ui-sdk/core/renderer"
import * as React from "react"
import { Pressable, Text, TextInput, View } from "react-native"
import {
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
} from "./calendar"
import { CalendarContext, type CalendarHandle } from "./calendar-context"
import { useFieldControl } from "./field-context"
import { layerInput } from "./native-host"
import { landIn, useHost } from "./overlay-host"
import {
  fromLeft,
  type NativeAnchor,
  usePlaced,
  usePlacement,
} from "./placement"
import {
  createOutlet,
  OutletContext,
  PopupLayer,
  useOutlet,
} from "./popup-parts"
import { mergeProps, withState } from "./render-element"
import {
  createParts,
  type ExitProps,
  HandleScope,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  useHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

/**
 * The fields placement adds to the content's state, as the web's CSS
 * variables and data attributes. Undefined until it's first placed.
 * @experimental
 */
type DatePickerPlacementState = {
  /** The side it opened on, after flipping. */
  side?: "top" | "right" | "bottom" | "left"
  /** How it lines up with the anchor. */
  align?: "start" | "center" | "end"
  /** The width of the input, or of the anchor it's placed against. */
  anchorWidth?: number
  /** The height of the input, or of the anchor it's placed against. */
  anchorHeight?: number
  /** The width it has before reaching the edge of the space it may use. */
  availableWidth?: number
  /** The height it has before reaching the edge of the space it may use. */
  availableHeight?: number
  /** The point facing the anchor, as a `transformOrigin` style, like `"100px 0px"`. */
  transformOrigin?: string
}

/**
 * The props of `DatePicker`.
 * @experimental
 */
type DatePickerProps = Omit<
  DatePickerOptions,
  "container" | "name" | "startName" | "endName" | "form"
> &
  Omit<PartProps<typeof View, DatePickerState>, "defaultValue">

type InputPartProps = Omit<
  PartProps<typeof TextInput, DatePickerInputState>,
  "value" | "defaultValue" | "editable" | "readOnly"
> &
  DatePickerInputProps

type ContentPartProps = PartProps<
  typeof View,
  DatePickerContentState & PresenceState & DatePickerPlacementState
> &
  Omit<DatePickerContentProps, "container" | "anchor"> & {
    /** Places the popup against this instead of the start input: a view, like a ref's `current`, or a point in window coordinates. */
    anchor?: NativeAnchor | null
  } & ExitProps

type DatePickerParts = Parts<typeof datePicker, { clear: typeof Pressable }>

const parts: DatePickerParts = createParts(
  datePicker,
  { clear: Pressable },
  datePickerNative
)

/**
 * Holds the date picker's parts, in a `View`. Without children it renders an
 * input, or two in range mode, the trigger and the popup. The popup renders
 * in the app's `OverlayHost`.
 * @experimental
 */
function DatePicker({
  mode,
  value,
  defaultValue,
  onValueChange,
  month,
  defaultMonth,
  onMonthChange,
  open,
  defaultOpen,
  onOpenChange,
  onOpenChangeComplete,
  closeOnSelect,
  presentation,
  dismissible,
  onDismissAttempt,
  min,
  max,
  unavailable,
  disabled,
  readOnly,
  months,
  pageBy,
  locale,
  weekStartsOn,
  weekdayFormat,
  monthFormat,
  fixedWeeks,
  showOutsideDays,
  today,
  timeZone,
  minDays,
  maxDays,
  allowUnavailable,
  required,
  controller,
  debug,
  children,
  ...props
}: DatePickerProps) {
  const picker = usePrimitive(
    datePicker,
    {
      mode,
      value,
      defaultValue,
      onValueChange,
      month,
      defaultMonth,
      onMonthChange,
      open,
      defaultOpen,
      onOpenChange,
      onOpenChangeComplete,
      closeOnSelect,
      presentation,
      dismissible,
      onDismissAttempt,
      min,
      max,
      unavailable,
      disabled,
      readOnly,
      months,
      pageBy,
      locale,
      weekStartsOn,
      weekdayFormat,
      monthFormat,
      fixedWeeks,
      showOutsideDays,
      today,
      timeZone,
      minDays,
      maxDays,
      allowUnavailable,
      required,
      controller,
      debug,
    },
    datePickerNative
  )
  const [outlet] = React.useState(createOutlet)
  const content =
    children === undefined
      ? (state: DatePickerState) => (
          <>
            <DatePickerInput />
            {state.mode === "range" && <DatePickerInput end />}
            <DatePickerTrigger />
            <DatePickerContent />
          </>
        )
      : children
  return (
    <HandleScope handle={picker as unknown as PrimitiveHandle<never>}>
      <CalendarContext value={picker as unknown as CalendarHandle}>
        <OutletContext.Provider value={outlet}>
          {usePart(
            picker,
            "root",
            {},
            { ...(props as Record<string, unknown>), children: content },
            View
          )}
          <PopupLayer handle={picker} outlet={outlet} />
        </OutletContext.Provider>
      </CalendarContext>
    </HandleScope>
  )
}

/**
 * A `TextInput` that reads a date typed in the locale's order when editing
 * ends or on submit. `end` makes it a range's end. A Field names the first.
 * @experimental
 */
function DatePickerInput({ end, ...props }: InputPartProps) {
  const picker = useHandle(datePicker)
  const index = end ? 1 : 0
  const { disabled, formDisabled, readOnly } = picker.state
  const field = useFieldControl(props, () => picker.api.internal.focusInput())
  const editable = !disabled && !formDisabled && !readOnly
  const commit = () =>
    withSource("keyboard", () => picker.api.internal.commit(index))
  return usePart(
    picker,
    "input",
    { end, id: end ? "end" : "start" },
    mergeProps(end ? props : field, {
      value: datePickerText(picker.state, end),
      onChangeText: (text: string) =>
        withSource("keyboard", () => picker.api.internal.setText(index, text)),
      onSubmitEditing: commit,
      onBlur: commit,
      editable,
      // Android keeps a TextInput disabled when its disabled state is left
      // out, and enables a read-only one, which then takes typing, when it's false.
      accessibilityState: { disabled: !editable, ...props.accessibilityState },
    }),
    TextInput
  )
}

/**
 * Opens and closes the calendar: a `Pressable` with the button role and its
 * expanded state. Named "Choose date" and the date chosen; pass `aria-label`
 * in another language.
 * @experimental
 */
function DatePickerTrigger({
  children = calendarIcon,
  ...props
}: PartProps<typeof Pressable, DatePickerTriggerState>) {
  const picker = useHandle(datePicker)
  return usePart(
    picker,
    "trigger",
    {},
    mergeProps(
      { onTouchStart: landIn(picker.api) },
      { ...(props as Record<string, unknown>), children }
    ),
    Pressable
  )
}

const calendarIcon = <Text>📅</Text>

/**
 * The popup, a `View` placed beside the start input, with the placement in
 * its state. Without children it renders Previous, the heading, Next and a
 * grid for each month; every Calendar part works inside it. VoiceOver's
 * escape gesture on it closes the popup with the `"escape-key"` reason.
 * @experimental
 */
function DatePickerContent(props: ContentPartProps) {
  return useOutlet("content", <Placed {...props} />)
}

// Rendered where the content renders, so it measures in that host.
function Placed({
  side,
  align = "start",
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  finalFocus,
  keepMounted,
  children,
  ...props
}: ContentPartProps) {
  const picker = useHandle(datePicker)
  const mounted = React.useSyncExternalStore(
    picker.instance.subscribe,
    () => picker.state.mounted
  )
  const placement = usePlacement(
    picker.api,
    useHost(),
    props.style,
    mounted,
    anchors
  )
  const placed = usePlaced(placement)
  const body =
    children === undefined ? (
      <>
        <View style={row}>
          <CalendarPrevious />
          <CalendarHeading />
          <CalendarNext />
        </View>
        {Array.from({ length: picker.state.months }, (_, offset) => (
          <CalendarGrid key={offset} offset={offset} />
        ))}
      </>
    ) : (
      children
    )
  return usePart(
    picker,
    "content",
    {
      side,
      align,
      sideOffset,
      alignOffset,
      collisionPadding,
      arrowPadding,
      anchor: anchor as never,
      finalFocus,
      keepMounted,
    },
    mergeProps(
      {
        ref: placement.content,
        style: {
          position: "absolute",
          top: placed?.y,
          opacity: placed ? undefined : 0,
          ...(placed && fromLeft(placed.x)),
        },
        accessibilityViewIsModal: false,
        onAccessibilityEscape: () => layerInput()?.escape(picker.api),
        onTouchStart: landIn(picker.api),
      },
      {
        ...props,
        ...withState<
          DatePickerContentState & PresenceState,
          DatePickerPlacementState
        >({ ...props, children: body }, () => {
          const { arrowOffset: _, ...state } = placed?.state ?? {}
          return state
        }),
      }
    ),
    View
  )
}

const anchors = ["input", "trigger"]
const row = { flexDirection: "row", alignItems: "center" } as const

/**
 * The format to type, like "MM/DD/YYYY", in a `Text`. The inputs are
 * described by it.
 * @experimental
 */
function DatePickerHint({
  children = placeholder,
  ...props
}: PartProps<typeof Text, DatePickerHintState>) {
  return usePart(
    useHandle(datePicker),
    "hint",
    {},
    { ...(props as Record<string, unknown>), children },
    Text
  )
}

const placeholder = (state: DatePickerHintState) => state.placeholder

/**
 * A `Pressable` that clears the value and starts editing the input.
 * @experimental
 */
const DatePickerClear: DatePickerParts["Clear"] = parts.Clear

/**
 * A `Pressable` that selects the value it holds, like the last 7 days: a
 * toggle button, checked while its value is the one selected.
 * @experimental
 */
function DatePickerPreset({
  value,
  ...props
}: PartProps<typeof Pressable, DatePickerPresetState> & {
  value: DatePickerValue
}) {
  return usePart(
    useHandle(datePicker),
    "preset",
    { value, id: JSON.stringify(value) },
    props as Record<string, unknown>,
    Pressable
  )
}

export {
  CalendarDay,
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
} from "./calendar"
export { createDatePickerController } from "@ui-sdk/core/date-picker"
export type {
  CalendarDayState,
  CalendarGridCell,
  CalendarGridState,
  CalendarHeadingState,
  CalendarStepState,
  CalendarWeekdayState,
  DateMatcher,
  DateMatchers,
  DatePickerApi,
  DatePickerChangeOptions,
  DatePickerClearState,
  DatePickerContentProps,
  DatePickerContentState,
  DatePickerController,
  DatePickerDismissReason,
  DatePickerHintState,
  DatePickerInputProps,
  DatePickerInputState,
  DatePickerMode,
  DatePickerMonthChangeReason,
  DatePickerOpenChangeReason,
  DatePickerOptions,
  DatePickerPresetProps,
  DatePickerPresetState,
  DatePickerPrimitive,
  DatePickerState,
  DatePickerTriggerState,
  DatePickerValue,
  DatePickerValueChangeReason,
  ISOMonth,
} from "@ui-sdk/core/date-picker"

export {
  DatePicker,
  DatePickerClear,
  DatePickerContent,
  DatePickerHint,
  DatePickerInput,
  type DatePickerPlacementState,
  DatePickerPreset,
  type DatePickerProps,
  DatePickerTrigger,
}
