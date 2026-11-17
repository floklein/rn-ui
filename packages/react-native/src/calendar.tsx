import {
  calendar as calendarPrimitive,
  type CalendarDayState,
  type CalendarGridCell,
  type CalendarGridState,
  type CalendarHeadingState,
  type CalendarOptions,
  type CalendarState,
  type CalendarStepState,
  type CalendarWeekdayState,
} from "@ui-sdk/core/calendar"
import { calendarNative } from "@ui-sdk/core/native"
import * as React from "react"
import { Pressable, Text, View } from "react-native"
import { CalendarContext, GridContext } from "./calendar-context"
import type { Interaction } from "./render-element"
import { type PartProps, usePart, usePrimitive } from "./use-primitive"

function useCalendar(part: string) {
  const context = React.useContext(CalendarContext)
  if (!context) {
    throw new Error(`${part} must be used inside <Calendar>.`)
  }
  return context
}

function useGrid(part: string) {
  const context = React.useContext(GridContext)
  if (!context) {
    throw new Error(`${part} must be used inside <CalendarGrid>.`)
  }
  return context
}

/**
 * Months of days in a `View`. Without children it renders a heading,
 * Previous and Next, and a grid for each month.
 * @experimental
 */
function Calendar({
  mode,
  value,
  defaultValue,
  onValueChange,
  month,
  defaultMonth,
  onMonthChange,
  min,
  max,
  unavailable,
  disabled,
  readOnly,
  deselectable,
  onFocusedChange,
  onAnchorChange,
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
  controller,
  debug,
  children,
  ...props
}: CalendarOptions &
  Omit<PartProps<typeof View, CalendarState>, "defaultValue">) {
  const calendar = usePrimitive(
    calendarPrimitive,
    {
      mode,
      value,
      defaultValue,
      onValueChange,
      month,
      defaultMonth,
      onMonthChange,
      min,
      max,
      unavailable,
      disabled,
      readOnly,
      deselectable,
      onFocusedChange,
      onAnchorChange,
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
      controller,
      debug,
    },
    calendarNative
  )
  const content =
    children === undefined ? (
      <>
        <View style={row}>
          <CalendarPrevious />
          <CalendarHeading />
          <CalendarNext />
        </View>
        {Array.from(
          { length: Math.max(1, Math.floor(months ?? 1) || 1) },
          (_, offset) => (
            <CalendarGrid key={offset} offset={offset} />
          )
        )}
      </>
    ) : (
      children
    )
  return (
    <CalendarContext value={calendar}>
      {usePart(
        calendar,
        "root",
        {},
        { ...(props as Record<string, unknown>), children: content },
        View
      )}
    </CalendarContext>
  )
}

const row = { flexDirection: "row", alignItems: "center" } as const

/**
 * The months shown, like "October 2026", in a `Text`. Screen readers hear it
 * change.
 * @experimental
 */
function CalendarHeading({
  children = label,
  ...props
}: PartProps<typeof Text, CalendarHeadingState>) {
  return usePart(
    useCalendar("CalendarHeading"),
    "heading",
    {},
    { ...(props as Record<string, unknown>), children },
    Text
  )
}

const label = (state: { label: string }) => state.label

type StepProps = PartProps<typeof Pressable, CalendarStepState>

function useStep(
  name: "previous" | "next",
  part: string,
  { children, ...props }: StepProps
) {
  const content = children ?? <Text>{name === "previous" ? "‹" : "›"}</Text>
  return usePart(
    useCalendar(part),
    name,
    {},
    { ...(props as Record<string, unknown>), children: content },
    Pressable
  )
}

/**
 * Shows the month before: a `Pressable` with the button role. Named
 * "Previous month"; pass `aria-label` in another language.
 * @experimental
 */
function CalendarPrevious(props: StepProps) {
  return useStep("previous", "CalendarPrevious", props)
}

/**
 * Shows the month after: a `Pressable` with the button role. Named
 * "Next month"; pass `aria-label` in another language.
 * @experimental
 */
function CalendarNext(props: StepProps) {
  return useStep("next", "CalendarNext", props)
}

/**
 * One month's grid, in a `View`. `offset` picks which of the months shown,
 * from 0. Without children it renders its weekdays and weeks.
 * @experimental
 */
function CalendarGrid({
  offset = 0,
  children = defaultGrid,
  ...props
}: PartProps<typeof View, CalendarGridState> & { offset?: number }) {
  const content = (state: CalendarGridState, interaction: Interaction) => (
    <GridScope offset={offset} state={state}>
      {typeof children === "function" ? children(state, interaction) : children}
    </GridScope>
  )
  return usePart(
    useCalendar("CalendarGrid"),
    "grid",
    { offset, id: String(offset) },
    { ...(props as Record<string, unknown>), children: content },
    View
  )
}

const defaultGrid = (
  <>
    <CalendarWeekdays />
    <CalendarWeeks />
  </>
)

function GridScope({
  offset,
  state,
  children,
}: {
  offset: number
  state: CalendarGridState
  children: React.ReactNode
}) {
  const grid = React.useMemo(
    () => ({ offset, state }),
    [offset, state.month, state.weeks]
  )
  return <GridContext value={grid}>{children}</GridContext>
}

/**
 * The row of weekday names, in a `View`, a weekday in each column. Its
 * children can be a function of the column's index that renders it, like
 * `(index) => <CalendarWeekday index={index} style={…} />`.
 * @experimental
 */
function CalendarWeekdays({
  children,
  style,
  ...props
}: Omit<React.ComponentProps<typeof View>, "children"> & {
  children?: (index: number) => React.ReactNode
}) {
  const calendar = useCalendar("CalendarWeekdays")
  const { offset, state } = useGrid("CalendarWeekdays")
  return usePart(
    calendar,
    "weekdays",
    { id: String(offset) },
    {
      ...(props as Record<string, unknown>),
      style: [row, style],
      children: state.weekdays.map((weekday, index) => (
        <React.Fragment key={weekday}>
          {children ? children(index) : <CalendarWeekday index={index} />}
        </React.Fragment>
      )),
    },
    View
  )
}

/**
 * A weekday's column header, in a `Text`. Shows its name in
 * `weekdayFormat` unless it has children; screen readers hear its full name.
 * @experimental
 */
function CalendarWeekday({
  index,
  children = label,
  ...props
}: PartProps<typeof Text, CalendarWeekdayState> & { index: number }) {
  const { offset } = useGrid("CalendarWeekday")
  return usePart(
    useCalendar("CalendarWeekday"),
    "weekday",
    { index, id: `${offset}-${index}` },
    { ...(props as Record<string, unknown>), children },
    Text
  )
}

/**
 * The weeks of the grid's month, a row `View` each, with a day in each
 * cell. Its children can be a function of a cell that renders its day, like
 * `(cell) => <CalendarDay value={cell.date} style={…} />`. A cell that shows
 * nothing is an empty `View` that flexes, so days that flex keep their columns.
 * @experimental
 */
function CalendarWeeks({
  children,
  ...props
}: Omit<React.ComponentProps<typeof View>, "children"> & {
  children?: (cell: CalendarGridCell) => React.ReactNode
}) {
  const { offset, state } = useGrid("CalendarWeeks")
  return (
    <View {...props}>
      {state.weeks.map((week, index) => (
        <CalendarWeek key={week[0]!.date} id={`${offset}-${index}`}>
          {week.map((cell) =>
            cell.hidden ? (
              <View key={cell.date} style={empty} />
            ) : (
              <React.Fragment key={cell.date}>
                {children ? children(cell) : <CalendarDay value={cell.date} />}
              </React.Fragment>
            )
          )}
        </CalendarWeek>
      ))}
    </View>
  )
}

const empty = { flex: 1 }

function CalendarWeek({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  return usePart(
    useCalendar("CalendarWeeks"),
    "week",
    { id },
    { style: row, children },
    View
  )
}

/**
 * A day: a `Pressable` with the button role, selected when it's picked.
 * Shows the day of the month in a `Text` unless it has children; screen
 * readers hear the full date.
 * @experimental
 */
function CalendarDay({
  value,
  children = dayLabel,
  ...props
}: PartProps<typeof Pressable, CalendarDayState> & { value: string }) {
  const grid = React.useContext(GridContext)
  return usePart(
    useCalendar("CalendarDay"),
    "day",
    { value, offset: grid?.offset ?? 0 },
    { ...(props as Record<string, unknown>), children },
    Pressable
  )
}

const dayLabel = (state: CalendarDayState) => <Text>{state.label}</Text>

export { createCalendarController } from "@ui-sdk/core/calendar"
export type {
  CalendarAnchorChangeReason,
  CalendarApi,
  CalendarChangeOptions,
  CalendarController,
  CalendarDayProps,
  CalendarDayState,
  CalendarFocusedChangeReason,
  CalendarGridCell,
  CalendarGridProps,
  CalendarGridState,
  CalendarHeadingState,
  CalendarMode,
  CalendarMonthChangeReason,
  CalendarOptions,
  CalendarPrimitive,
  CalendarState,
  CalendarStepState,
  CalendarValue,
  CalendarValueChangeReason,
  CalendarWeekdayProps,
  CalendarWeekdayState,
  DateMatcher,
  DateMatchers,
  ISOMonth,
} from "@ui-sdk/core/calendar"

export {
  Calendar,
  CalendarDay,
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
}
