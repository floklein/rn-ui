import { act, render, screen } from "@testing-library/react-native"
import * as React from "react"
import {
  AccessibilityInfo,
  type HostInstance,
  Pressable,
  Text,
} from "react-native"
import {
  createTimelineController,
  Timeline,
  TimelineConnector,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "../src/timeline"

const events = [
  { title: "Deployed", time: "2:32 PM", description: "Version 2.4.1." },
  { title: "Checks passed", time: "2:20 PM", description: "312 tests." },
  { title: "Merged", time: "1:58 PM", description: "Into main." },
]

function Events(props: React.ComponentProps<typeof Timeline>) {
  return (
    <Timeline aria-label="Activity" testID="timeline" {...props}>
      {events.map((event) => (
        <TimelineItem key={event.title} testID={event.title}>
          <TimelineMarker testID={`${event.title} marker`} />
          <TimelineConnector testID={`${event.title} connector`} />
          <TimelineTitle>{event.title}</TimelineTitle>
          <TimelineTime>{event.time}</TimelineTime>
          <TimelineDescription>{event.description}</TimelineDescription>
        </TimelineItem>
      ))}
    </Timeline>
  )
}

describe("Timeline", () => {
  test("it's a list, whose events read their title, time and description", async () => {
    await render(<Events />)
    expect(screen.getByTestId("timeline").props.accessibilityRole).toBe("list")
    for (const text of ["Deployed", "2:32 PM", "Version 2.4.1."]) {
      expect(screen.getByText(text)).toBeOnTheScreen()
    }
  })

  test("each event's state has its place, from 0, and whether it's first or last; the root's has the count", async () => {
    const places: Record<string, unknown> = {}
    let count: number | undefined
    await render(
      <Timeline
        aria-label="Activity"
        style={(state) => void (count = state.count)}
      >
        {events.map((event) => (
          <TimelineItem
            key={event.title}
            style={({ index, first, last }) =>
              void (places[event.title] = { index, first, last })
            }
          >
            <TimelineTitle>{event.title}</TimelineTitle>
          </TimelineItem>
        ))}
      </Timeline>
    )
    expect(count).toBe(3)
    expect(places).toEqual({
      Deployed: { index: 0, first: true, last: false },
      "Checks passed": { index: 1, first: false, last: false },
      Merged: { index: 2, first: false, last: true },
    })
  })

  test("an event added at the start moves every event's place", async () => {
    const places: Record<string, unknown> = {}
    let count: number | undefined
    const List = ({ titles }: { titles: string[] }) => (
      <Timeline
        aria-label="Activity"
        style={(state) => void (count = state.count)}
      >
        {titles.map((title) => (
          <TimelineItem
            key={title}
            style={({ index, first, last }) =>
              void (places[title] = { index, first, last })
            }
          >
            <TimelineTitle>{title}</TimelineTitle>
          </TimelineItem>
        ))}
      </Timeline>
    )
    const { rerender } = await render(<List titles={["B", "C"]} />)
    await rerender(<List titles={["A", "B", "C"]} />)
    expect(count).toBe(3)
    expect(places).toEqual({
      A: { index: 0, first: true, last: false },
      B: { index: 1, first: false, last: false },
      C: { index: 2, first: false, last: true },
    })
  })

  test("each part inside an event has the event's place, kept as events are added after it", async () => {
    const lasts: Record<string, boolean> = {}
    const List = ({ titles }: { titles: string[] }) => (
      <Timeline aria-label="Activity">
        {titles.map((title) => (
          <TimelineItem key={title}>
            <TimelineConnector
              style={({ last, index }) =>
                void (lasts[`${title} ${index}`] = last)
              }
            />
            <TimelineTitle>{title}</TimelineTitle>
          </TimelineItem>
        ))}
      </Timeline>
    )
    const { rerender } = await render(<List titles={["A"]} />)
    expect(lasts["A 0"]).toBe(true)
    await rerender(<List titles={["A", "B"]} />)
    expect(lasts["A 0"]).toBe(false)
    expect(lasts["B 1"]).toBe(true)
  })

  test("markers and connectors are hidden from screen readers", async () => {
    await render(<Events />)
    for (const part of ["marker", "connector"]) {
      expect(
        screen.getByTestId(`Deployed ${part}`, { includeHiddenElements: true })
      ).not.toBeVisible()
    }
  })

  test("an event's status reaches each of its parts", async () => {
    const statuses: unknown[] = []
    await render(
      <Timeline aria-label="Order status">
        <TimelineItem
          status="current"
          style={({ status }) => void statuses.push(status)}
        >
          <TimelineMarker style={({ status }) => void statuses.push(status)} />
          <TimelineTitle style={({ status }) => void statuses.push(status)}>
            Shipped
          </TimelineTitle>
        </TimelineItem>
      </Timeline>
    )
    expect(new Set(statuses)).toEqual(new Set(["current"]))
  })

  test("an accessible event is named by its title and described by its time and description", async () => {
    await render(
      <Timeline aria-label="Activity">
        <TimelineItem accessible testID="event">
          <TimelineTitle>Deployed</TimelineTitle>
          <TimelineTime>2:32 PM</TimelineTime>
          <TimelineDescription>Version 2.4.1.</TimelineDescription>
        </TimelineItem>
      </Timeline>
    )
    const event = screen.getByTestId("event")
    expect(event.props.accessibilityLabel).toBe("Deployed")
    expect(event.props.accessibilityHint).toBe("2:32 PM Version 2.4.1.")
  })

  test("an event with controls stays a container, so its button is its own element", async () => {
    await render(
      <Timeline aria-label="Changelog">
        <TimelineItem testID="event">
          <TimelineTitle>Version 2.4</TimelineTitle>
          <Pressable role="button">
            <Text>What Changed</Text>
          </Pressable>
        </TimelineItem>
      </Timeline>
    )
    expect(screen.getByTestId("event").props.accessible).toBeUndefined()
    expect(
      screen.getByRole("button", { name: "What Changed" })
    ).toBeOnTheScreen()
  })

  test("the controller's focus() moves the screen reader to an event by its value", async () => {
    const focus = jest.mocked(AccessibilityInfo.sendAccessibilityEvent)
    focus.mockClear()
    const controller = createTimelineController()
    const shipped = React.createRef<HostInstance>()
    await render(
      <Timeline aria-label="Order status" controller={controller}>
        {["placed", "shipped"].map((value) => (
          <TimelineItem
            key={value}
            value={value}
            accessible
            ref={value === "shipped" ? shipped : undefined}
          >
            <TimelineTitle>{value}</TimelineTitle>
          </TimelineItem>
        ))}
      </Timeline>
    )
    await act(() => controller.focus("shipped"))
    expect(focus).toHaveBeenCalledTimes(1)
    expect(focus.mock.lastCall?.[1]).toBe("focus")
    expect(focus.mock.lastCall?.[0] === shipped.current).toBe(true)
  })

  test("a feed is a list, busy while it loads", async () => {
    await render(<Events feed busy />)
    const feed = screen.getByTestId("timeline")
    expect(feed.props.accessibilityRole).toBe("list")
    expect(feed.props.accessibilityState).toMatchObject({ busy: true })
  })

  test("a touch on an event doesn't take the responder, so a scroll view around it scrolls", async () => {
    await render(<Events />)
    const event = screen.getByTestId("Deployed")
    expect(event.props.onStartShouldSetResponder).toBeUndefined()
    expect(event.props.onMoveShouldSetResponder).toBeUndefined()
  })
})
