import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native"
import { createRef } from "react"
import { AccessibilityInfo, type HostInstance, View } from "react-native"
import {
  DatePicker,
  DatePickerClear,
  DatePickerContent,
  DatePickerHint,
  DatePickerInput,
  DatePickerPreset,
  DatePickerTrigger,
} from "../src/date-picker"
import { Field, FieldLabel } from "../src/field"
import { OverlayHost } from "../src/overlays"

type Rect = [x: number, y: number, width: number, height: number]

const boxes = new Map<string | undefined, Rect>()
let measureInWindow: jest.Mock | undefined
beforeEach(async () => {
  boxes.clear()
  boxes.set(undefined, [0, 0, 400, 800])
  boxes.set("input", [16, 100, 200, 40])
  boxes.set("trigger", [224, 100, 40, 40])
  boxes.set("content", [0, 0, 300, 320])
  const ref = createRef<HostInstance>()
  await render(<View ref={ref} />)
  cleanup()
  measureInWindow = ref.current!.measureInWindow as unknown as jest.Mock
  measureInWindow.mockImplementation(function (
    this: { props: { testID?: string } },
    onSuccess: (...rect: Rect) => void
  ) {
    onSuccess(...(boxes.get(this.props.testID) ?? [0, 0, 0, 0]))
  })
})
afterEach(() => measureInWindow?.mockReset())

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)
afterEach(() => sendAccessibilityEvent.mockClear())

const focusedLabel = () =>
  (
    sendAccessibilityEvent.mock.lastCall?.[0] as unknown as
      { props: { accessibilityLabel?: string } } | undefined
  )?.props.accessibilityLabel

const states: Record<string, unknown>[] = []
afterEach(() => {
  states.length = 0
})

function Example({
  children,
  ...props
}: Omit<React.ComponentProps<typeof DatePicker>, "children"> & {
  children?: React.ReactNode
}) {
  return (
    <OverlayHost>
      <DatePicker locale="en-US" today="2026-10-01" {...props}>
        {children ?? <DatePickerInput testID="input" aria-label="Due date" />}
        <DatePickerTrigger testID="trigger" />
        <DatePickerContent
          testID="content"
          style={(state) => {
            states.push(state)
            return {}
          }}
        />
      </DatePicker>
    </OverlayHost>
  )
}

const input = () => screen.getByTestId("input")
const trigger = () => screen.getByTestId("trigger")
const day = (name: string) => screen.getByRole("button", { name })

test("the input shows the date, and the trigger names it", async () => {
  await render(<Example defaultValue="2026-10-16" />)
  expect(input().props.value).toBe("10/16/2026")
  expect(trigger()).toHaveAccessibleName(
    "Choose date, Friday, October 16, 2026"
  )
  expect(trigger()).toBeCollapsed()
})

test("pressing the trigger opens the calendar beside the input, on the selected month", async () => {
  await render(<Example defaultValue="2026-10-16" />)
  await fireEvent.press(trigger())
  expect(trigger()).toBeExpanded()
  expect(screen.getByText("October 2026")).toBeTruthy()
  expect(day("Friday, October 16, 2026")).toBeSelected()
  expect(states.at(-1)).toMatchObject({
    open: true,
    side: "bottom",
    align: "start",
    anchorWidth: 200,
  })
})

test("picking a day selects it, closes the popup and writes the input", async () => {
  const onValueChange = jest.fn()
  await render(<Example onValueChange={onValueChange} />)
  await fireEvent.press(trigger())
  await fireEvent.press(day("Saturday, October 17, 2026"))
  expect(onValueChange).toHaveBeenLastCalledWith(
    "2026-10-17",
    expect.objectContaining({ reason: "item-press" })
  )
  expect(screen.queryByText("October 2026")).toBeNull()
  expect(input().props.value).toBe("10/17/2026")
})

test("a typed date is read when editing ends", async () => {
  const onValueChange = jest.fn()
  await render(<Example onValueChange={onValueChange} />)
  await fireEvent.changeText(input(), "12/24/2026")
  expect(input().props.value).toBe("12/24/2026")
  expect(onValueChange).not.toHaveBeenCalled()
  await fireEvent(input(), "blur")
  expect(onValueChange).toHaveBeenLastCalledWith(
    "2026-12-24",
    expect.objectContaining({ reason: "input-commit", source: "keyboard" })
  )
})

test("text that isn't a date stays, and marks the input invalid on submit", async () => {
  const invalid = jest.fn()
  await render(
    <Example>
      <DatePickerInput
        testID="input"
        aria-label="Due date"
        style={(state) => {
          invalid(state.invalid)
          return {}
        }}
      />
    </Example>
  )
  await fireEvent.changeText(input(), "soon")
  await fireEvent(input(), "submitEditing")
  expect(input().props.value).toBe("soon")
  expect(invalid).toHaveBeenLastCalledWith(true)
})

test("opening asks the screen reader to move to the selected day", async () => {
  await render(<Example defaultValue="2026-10-16" />)
  await fireEvent.press(trigger())
  expect(focusedLabel()).toBe("Friday, October 16, 2026")
})

test("disabled, the input isn't editable and the trigger opens nothing", async () => {
  await render(<Example disabled />)
  expect(input().props.editable).toBe(false)
  expect(input()).toBeDisabled()
  await fireEvent.press(trigger())
  expect(screen.queryByText("October 2026")).toBeNull()
})

test("a preset selects its value, and Clear empties it", async () => {
  await render(
    <OverlayHost>
      <DatePicker locale="en-US" today="2026-10-01">
        <DatePickerInput testID="input" aria-label="Due date" />
        <DatePickerPreset value="2026-10-31" testID="preset" />
        <DatePickerClear testID="clear" />
      </DatePicker>
    </OverlayHost>
  )
  await fireEvent.press(screen.getByTestId("preset"))
  expect(input().props.value).toBe("10/31/2026")
  expect(screen.getByTestId("preset").props.accessibilityState).toMatchObject({
    checked: true,
  })
  await fireEvent.press(screen.getByTestId("clear"))
  expect(input().props.value).toBe("")
})

test("range mode has an input for each end", async () => {
  await render(
    <OverlayHost>
      <DatePicker
        mode="range"
        locale="en-US"
        defaultValue={["2026-10-05", "2026-10-09"]}
      />
    </OverlayHost>
  )
  expect(screen.getByDisplayValue("10/05/2026")).toBeTruthy()
  expect(screen.getByDisplayValue("10/09/2026")).toBeTruthy()
  expect(
    screen.getByRole("button", {
      name: "Choose dates, Monday, October 5, 2026 to Friday, October 9, 2026",
    })
  ).toBeTruthy()
})

test("a Field names the input, and its label starts editing it", async () => {
  await render(
    <OverlayHost>
      <Field>
        <FieldLabel>Due date</FieldLabel>
        <DatePicker locale="en-US">
          <DatePickerInput testID="input" />
        </DatePicker>
      </Field>
    </OverlayHost>
  )
  expect(input()).toHaveAccessibleName("Due date")
  const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent")
  await act(() => fireEvent.press(screen.getByText("Due date")))
  expect(focus).toHaveBeenCalled()
})

test("closing sends the screen reader back to the trigger", async () => {
  await render(<Example defaultValue="2026-10-16" />)
  await fireEvent.press(trigger())
  await fireEvent.press(day("Saturday, October 17, 2026"))
  await act(() => Promise.resolve())
  expect(focusedLabel()).toBe("Choose date, Saturday, October 17, 2026")
})

test("the hint describes the input", async () => {
  await render(
    <Example>
      <DatePickerInput testID="input" aria-label="Due date" />
      <DatePickerHint />
    </Example>
  )
  expect(screen.getByText("MM/DD/YYYY")).toBeTruthy()
  expect(input().props.accessibilityHint).toBe("MM/DD/YYYY")
})

test("pressing the trigger reads a date typed but not yet submitted", async () => {
  await render(<Example defaultValue="2026-10-16" />)
  await fireEvent.changeText(input(), "12/24/2026")
  await fireEvent.press(trigger())
  expect(screen.getByText("December 2026")).toBeTruthy()
  expect(input().props.value).toBe("12/24/2026")
})
