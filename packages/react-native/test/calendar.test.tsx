import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { AccessibilityInfo, Platform, Text } from "react-native"
import {
  Calendar,
  CalendarDay,
  CalendarGrid,
  CalendarHeading,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
  createCalendarController,
} from "../src/calendar"
import { FieldSet } from "../src/field"

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

afterEach(() => sendAccessibilityEvent.mockClear())

const day = (name: string) => screen.getByRole("button", { name })
const focusedTestID = () =>
  (
    sendAccessibilityEvent.mock.lastCall?.[0] as unknown as
      { props: { testID?: string } } | undefined
  )?.props.testID

function Month(props: React.ComponentProps<typeof Calendar>) {
  return (
    <Calendar locale="en-US" {...props}>
      <CalendarHeading />
      <CalendarGrid>
        <CalendarWeekdays>
          {(index) => <CalendarWeekday index={index} testID={`w${index}`} />}
        </CalendarWeekdays>
        <CalendarWeeks testID="weeks">
          {(cell) => <CalendarDay value={cell.date} testID={cell.date} />}
        </CalendarWeeks>
      </CalendarGrid>
    </Calendar>
  )
}

describe("Calendar", () => {
  test("without children it shows the month's heading, its steps and a day button per date", async () => {
    await render(<Calendar defaultValue="2026-10-16" locale="en-US" />)
    expect(screen.getByText("October 2026")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Previous month" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Next month" })).toBeTruthy()
    expect(day("Friday, October 16, 2026")).toBeSelected()
    expect(day("Thursday, October 15, 2026")).not.toBeSelected()
  })

  test("a press on a day selects it, with the item-press reason and a touch source", async () => {
    const onValueChange = jest.fn()
    await render(
      <Calendar
        defaultValue="2026-10-16"
        locale="en-US"
        onValueChange={onValueChange}
      />
    )
    await fireEvent.press(day("Tuesday, October 20, 2026"))
    const [value, details] = onValueChange.mock.lastCall
    expect(value).toBe("2026-10-20")
    expect(details).toMatchObject({ reason: "item-press", source: "touch" })
    expect(day("Tuesday, October 20, 2026")).toBeSelected()
    expect(day("Friday, October 16, 2026")).not.toBeSelected()
  })

  test("Next and Previous turn the month, with their reasons", async () => {
    const onMonthChange = jest.fn()
    await render(
      <Calendar
        defaultMonth="2026-10"
        locale="en-US"
        onMonthChange={onMonthChange}
      />
    )
    await fireEvent.press(screen.getByRole("button", { name: "Next month" }))
    expect(onMonthChange.mock.lastCall[0]).toBe("2026-11")
    expect(onMonthChange.mock.lastCall[1].reason).toBe("next-press")
    expect(screen.getByText("November 2026")).toBeTruthy()
    await fireEvent.press(
      screen.getByRole("button", { name: "Previous month" })
    )
    expect(onMonthChange.mock.lastCall[1].reason).toBe("previous-press")
    expect(screen.getByText("October 2026")).toBeTruthy()
  })

  test("the heading's new month is read: Android's live region, an announcement on iOS", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
      .mockImplementation(() => {})
    await render(<Calendar defaultMonth="2027-03" locale="en-US" />)
    const heading = screen.getByText("March 2027")
    expect(heading.props.accessibilityLiveRegion).toBe(
      Platform.OS === "android" ? "polite" : undefined
    )
    expect(announce).not.toHaveBeenCalledWith("March 2027", expect.anything())
    await fireEvent.press(screen.getByRole("button", { name: "Next month" }))
    if (Platform.OS === "ios") {
      expect(announce).toHaveBeenCalledWith("April 2027", { queue: true })
    } else {
      expect(announce).not.toHaveBeenCalledWith("April 2027", expect.anything())
    }
    announce.mockRestore()
  })

  test("the controller's focus asks for the selected day, and for a date of another month once it shows", async () => {
    const controller = createCalendarController()
    await render(
      <Month
        controller={controller}
        defaultValue="2026-10-16"
        today="2026-10-01"
      />
    )
    await act(() => controller.focus())
    expect(focusedTestID()).toBe("2026-10-16")
    expect(sendAccessibilityEvent.mock.lastCall?.[1]).toBe("focus")
    await act(() => controller.focus("2026-12-24"))
    expect(screen.getByText("December 2026")).toBeTruthy()
    await waitFor(() => expect(focusedTestID()).toBe("2026-12-24"))
  })

  test("a press on a day of the next month selects it, shows its month and moves the screen reader to it", async () => {
    const onValueChange = jest.fn()
    await render(<Month defaultMonth="2026-09" onValueChange={onValueChange} />)
    await fireEvent.press(screen.getByTestId("2026-10-01"))
    expect(onValueChange.mock.lastCall[0]).toBe("2026-10-01")
    expect(screen.getByText("October 2026")).toBeTruthy()
    await waitFor(() => expect(focusedTestID()).toBe("2026-10-01"))
  })

  test("without outside days a cell of another month is an empty view", async () => {
    await render(<Month defaultMonth="2026-09" showOutsideDays={false} />)
    expect(screen.queryByTestId("2026-10-01")).toBeNull()
    expect(screen.queryByTestId("2026-08-31")).toBeNull()
    expect(screen.getByTestId("2026-09-30")).toBeTruthy()
  })

  test("an unavailable date is disabled and a press doesn't pick it", async () => {
    const onValueChange = jest.fn()
    await render(
      <Month
        defaultMonth="2026-10"
        unavailable={["2026-10-20"]}
        onValueChange={onValueChange}
      />
    )
    const booked = screen.getByTestId("2026-10-20")
    expect(booked.props.accessibilityState).toMatchObject({ disabled: true })
    await fireEvent.press(booked)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test("a disabled field set disables every day", async () => {
    await render(
      <FieldSet disabled>
        <Month defaultMonth="2026-10" />
      </FieldSet>
    )
    expect(
      screen.getByTestId("2026-10-20").props.accessibilityState
    ).toMatchObject({ disabled: true })
  })

  test("names and weekdays follow the locale option", async () => {
    await render(<Month defaultMonth="2026-10" locale="de-DE" />)
    expect(screen.getByText("Oktober 2026")).toBeTruthy()
    expect(screen.getByTestId("w0").props.accessibilityLabel).toBe("Montag")
    expect(screen.getByTestId("w0").props.children).toBe("Mo")
    expect(screen.getByTestId("2026-10-16").props.accessibilityLabel).toBe(
      "Freitag, 16. Oktober 2026"
    )
  })

  test("a range is picked with two presses, every day between selected", async () => {
    const onValueChange = jest.fn()
    await render(
      <Month
        mode="range"
        defaultMonth="2026-10"
        onValueChange={onValueChange}
      />
    )
    await fireEvent.press(screen.getByTestId("2026-10-12"))
    expect(onValueChange).not.toHaveBeenCalled()
    await fireEvent.press(screen.getByTestId("2026-10-14"))
    expect(onValueChange.mock.lastCall[0]).toEqual(["2026-10-12", "2026-10-14"])
    expect(
      screen.getByTestId("2026-10-13").props.accessibilityState
    ).toMatchObject({ selected: true })
  })

  test("a day's children can be a function of its state", async () => {
    await render(
      <Calendar defaultValue="2026-10-16" locale="en-US">
        <CalendarGrid>
          <CalendarWeeks>
            {(cell) => (
              <CalendarDay value={cell.date}>
                {(state) => (
                  <Text testID={`label-${cell.date}`}>
                    {state.selected ? `${state.label}*` : state.label}
                  </Text>
                )}
              </CalendarDay>
            )}
          </CalendarWeeks>
        </CalendarGrid>
      </Calendar>
    )
    expect(screen.getByTestId("label-2026-10-16").props.children).toBe("16*")
  })
})
