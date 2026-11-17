import { timelineNative } from "@ui-sdk/core/native"
import {
  timeline,
  type TimelineItemProps,
  type TimelineItemState as TimelineItemCoreState,
  type TimelineOptions,
  type TimelinePrimitive,
  type TimelineState as TimelineCoreState,
} from "@ui-sdk/core/timeline"
import * as React from "react"
import { Text, View } from "react-native"
import { withState } from "./render-element"
import {
  createParts,
  type PartProps,
  type Parts,
  useAround,
  useHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

/**
 * The state the root hands `style`, `className`, `children` and `render`
 * functions: core's, with the count the web writes as `--timeline-count`.
 * @experimental
 */
type TimelineState = TimelineCoreState & {
  /** How many events the timeline holds, 0 until they've mounted. */
  count: number
}

type Place = {
  /** Whether it's the first event. */
  first: boolean
  /** Whether it's the last event, which usually hides its connector. */
  last: boolean
  /** Its place among the events from 0, `undefined` until it has mounted. */
  index: number | undefined
}

/**
 * The state an event and every part inside it hand `style`, `className`,
 * `children` and `render` functions: core's, with the event's place, the
 * web's `data-first`, `data-last` and `--timeline-index`.
 * @experimental
 */
type TimelineItemState = TimelineItemCoreState & Place

/**
 * The state the `marker` part hands its functions: its event's.
 * @experimental
 */
type TimelineMarkerState = TimelineItemState
/**
 * The state the `connector` part hands its functions: its event's.
 * @experimental
 */
type TimelineConnectorState = TimelineItemState
/**
 * The state the `time` part hands its functions: its event's.
 * @experimental
 */
type TimelineTimeState = TimelineItemState
/**
 * The state the `title` part hands its functions: its event's.
 * @experimental
 */
type TimelineTitleState = TimelineItemState
/**
 * The state the `description` part hands its functions: its event's.
 * @experimental
 */
type TimelineDescriptionState = TimelineItemState

type TimelineParts = Parts<
  TimelinePrimitive,
  {
    item: typeof View
    marker: typeof View
    connector: typeof View
    time: typeof Text
    title: typeof Text
    description: typeof Text
  }
>

const parts: TimelineParts = createParts(
  timeline,
  {
    item: View,
    marker: View,
    connector: View,
    time: Text,
    title: Text,
    description: Text,
  },
  timelineNative
)

/**
 * A list of dated events, like an activity feed or an order's history, in a
 * `View` with the list role. Each event's texts are read in order, and
 * controls inside stay their own elements. `feed` makes it a feed that loads
 * more as people scroll.
 * @experimental
 */
function Timeline({
  orientation,
  loop,
  feed,
  busy,
  controller,
  debug,
  ...props
}: TimelineOptions & PartProps<typeof View, TimelineState>) {
  const handle = usePrimitive(
    timeline,
    { orientation, loop, feed, busy, controller, debug },
    timelineNative
  )
  const count = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => handle.state.size
  )
  return usePart(
    handle,
    "root",
    {},
    {
      ...props,
      ...withState<TimelineCoreState, { count: number }>(props, () => ({
        count,
      })),
    } as Record<string, unknown>,
    View
  )
}

/**
 * One event: a `View` whose title, time and description a screen reader
 * reads in turn. Pass `accessible` to an event with no controls inside to
 * read it as one element, named by its title and described by its time and
 * description.
 * @experimental
 */
function TimelineItem({
  value,
  status,
  ...props
}: TimelineItemProps & PartProps<typeof View, TimelineItemState>) {
  const id = React.useId()
  const key = value ?? id
  const place = usePlace(key)
  return (
    <parts.Item
      value={key}
      status={status}
      {...props}
      {...withState<TimelineItemCoreState, Place>(props, () => place)}
    />
  )
}

// A part inside an event skips the event's place in core's state, and React
// skips it when its event renders again, so it follows the place itself.
function usePlace(key: string | undefined) {
  const handle = useHandle(timeline)
  const first = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => key !== undefined && handle.state.first === key
  )
  const last = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => key !== undefined && handle.state.last === key
  )
  const position = React.useSyncExternalStore(handle.instance.subscribe, () =>
    key === undefined ? undefined : handle.state.positions[key]
  )
  return {
    first,
    last,
    index: position === undefined ? undefined : position - 1,
  }
}

type InsideEvent<Host extends typeof View | typeof Text> = (
  props: PartProps<Host, TimelineItemState>
) => React.ReactNode

const insideEvent = <Host extends typeof View | typeof Text>(
  Part: React.ComponentType<PartProps<Host, TimelineItemCoreState>>
) =>
  function InsideEvent(props: PartProps<Host, TimelineItemState>) {
    const event = useAround(timeline, "item") as { value?: string } | undefined
    const place = usePlace(event?.value)
    return (
      <Part
        {...(props as PartProps<Host, TimelineItemCoreState>)}
        {...withState<TimelineItemCoreState, Place>(props, () => place)}
      />
    )
  }

/**
 * The dot or icon that marks its event on the line: a `View` hidden from
 * screen readers.
 * @experimental
 */
const TimelineMarker: InsideEvent<typeof View> = insideEvent(parts.Marker)

/**
 * The line between its event's marker and the next one: a `View` hidden
 * from screen readers.
 * @experimental
 */
const TimelineConnector: InsideEvent<typeof View> = insideEvent(parts.Connector)

/**
 * When its event happened, as a `Text`. It describes the event.
 * @experimental
 */
const TimelineTime: InsideEvent<typeof Text> = insideEvent(parts.Time)

/**
 * What happened, as a `Text`. It names its event.
 * @experimental
 */
const TimelineTitle: InsideEvent<typeof Text> = insideEvent(parts.Title)

/**
 * More about its event, as a `Text`. It describes the event.
 * @experimental
 */
const TimelineDescription: InsideEvent<typeof Text> = insideEvent(
  parts.Description
)

export { createTimelineController } from "@ui-sdk/core/timeline"
export type {
  TimelineApi,
  TimelineController,
  TimelineItemProps,
  TimelineOptions,
  TimelineOrientation,
  TimelinePrimitive,
  TimelineStatus,
} from "@ui-sdk/core/timeline"

export {
  Timeline,
  TimelineConnector,
  type TimelineConnectorState,
  TimelineDescription,
  type TimelineDescriptionState,
  TimelineItem,
  type TimelineItemState,
  TimelineMarker,
  type TimelineMarkerState,
  type TimelineState,
  TimelineTime,
  type TimelineTimeState,
  TimelineTitle,
  type TimelineTitleState,
}
