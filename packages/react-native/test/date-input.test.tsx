import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Text, TextInput } from "react-native"
import { Field, FieldDescription, FieldLabel, FieldSet } from "../src/field"
import { createDateInputController, DateInput } from "../src/date-input"
import { TimeInput } from "../src/time-input"

afterEach(() => {
  jest.clearAllMocks()
})

const segment = (name: string) => screen.getByLabelText(name)

// The label of each text field focus was requested on, in order.
const focused = () =>
  (
    (TextInput as unknown as { prototype: { focus: jest.Mock } }).prototype
      .focus.mock.contexts as { props: { accessibilityLabel?: string } }[]
  ).map((input) => input.props.accessibilityLabel)

describe("DateInput", () => {
  test("typing fills a segment and moves on once it's complete, reporting the date from the keyboard", async () => {
    const onValueChange = jest.fn()
    await render(<DateInput locale="en-US" onValueChange={onValueChange} />)
    await fireEvent.changeText(segment("month"), "1")
    expect(segment("month").props.value).toBe("1")
    expect(focused()).toEqual([])
    await fireEvent.changeText(segment("month"), "11")
    expect(segment("month").props.value).toBe("11")
    expect(focused()).toEqual(["day"])
    await fireEvent.changeText(segment("day"), "2")
    await fireEvent.changeText(segment("day"), "")
    await fireEvent.changeText(segment("day"), "4")
    expect(segment("day").props.value).toBe("04")
    await fireEvent.changeText(segment("year"), "2026")
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith(
      "2026-11-04",
      expect.objectContaining({ reason: "input-change", source: "keyboard" })
    )
  })

  test("a letter in a number segment is written back at once, with the selection it had", async () => {
    await render(<DateInput locale="en-US" defaultValue="2026-11-04" />)
    await fireEvent(segment("month"), "selectionChange", {
      nativeEvent: { selection: { start: 1, end: 1 } },
    })
    await fireEvent.changeText(segment("month"), "1x1")
    expect(segment("month").props.value).toBe("11")
    expect(segment("month").props.selection).toEqual({ start: 1, end: 1 })
    await fireEvent(segment("month"), "selectionChange", {
      nativeEvent: { selection: { start: 2, end: 2 } },
    })
    await fireEvent(segment("month"), "selectionChange", {
      nativeEvent: { selection: { start: 0, end: 0 } },
    })
    expect(segment("month").props.selection).toBeUndefined()
  })

  test("Backspace empties a segment, then goes back from an empty one", async () => {
    const onValueChange = jest.fn()
    await render(
      <DateInput
        locale="en-US"
        defaultValue="2026-11-04"
        onValueChange={onValueChange}
      />
    )
    await fireEvent(segment("day"), "keyPress", {
      nativeEvent: { key: "Backspace" },
    })
    await fireEvent.changeText(segment("day"), "0")
    expect(segment("day").props.value).toBe("")
    expect(onValueChange).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ reason: "input-change", source: "keyboard" })
    )
    expect(focused()).toEqual([])
    await fireEvent(segment("day"), "keyPress", {
      nativeEvent: { key: "Backspace" },
    })
    expect(focused()).toEqual(["month"])
  })

  test("Backspace reported after the deletion it made doesn't go back too", async () => {
    await render(<DateInput locale="en-US" defaultValue="2026-11-04" />)
    await fireEvent.changeText(segment("day"), "0")
    await fireEvent(segment("day"), "keyPress", {
      nativeEvent: { key: "Backspace" },
    })
    expect(focused()).toEqual([])
    await act(() => new Promise((resolve) => setTimeout(resolve)))
    await fireEvent(segment("day"), "keyPress", {
      nativeEvent: { key: "Backspace" },
    })
    expect(focused()).toEqual(["month"])
  })

  test("leaving a segment keeps the digits typed so far", async () => {
    const onValueChange = jest.fn()
    await render(
      <DateInput
        locale="en-US"
        defaultValue="2026-11-04"
        onValueChange={onValueChange}
      />
    )
    await fireEvent.changeText(segment("month"), "111")
    expect(segment("month").props.value).toBe("1")
    expect(onValueChange).not.toHaveBeenCalled()
    await fireEvent(segment("month"), "blur")
    expect(segment("month").props.value).toBe("01")
    expect(onValueChange).toHaveBeenCalledWith(
      "2026-01-04",
      expect.objectContaining({ reason: "input-change" })
    )
  })

  test("a pasted date sets the value", async () => {
    const onValueChange = jest.fn()
    await render(<DateInput locale="en-US" onValueChange={onValueChange} />)
    await fireEvent.changeText(segment("month"), "2026-11-04")
    expect(onValueChange).toHaveBeenCalledWith(
      "2026-11-04",
      expect.objectContaining({ reason: "paste" })
    )
    expect(segment("year").props.value).toBe("2026")
  })

  test("each segment is a named spinbutton with the keyboard its content needs, and the text between them is hidden", async () => {
    await render(<DateInput locale="en-US" defaultValue="2026-11-04" />)
    const day = segment("day")
    expect(day.props.accessibilityRole).toBe("spinbutton")
    expect(day.props.accessibilityValue).toEqual({
      min: 1,
      max: 30,
      now: 4,
      text: "04",
    })
    expect(day.props.inputMode).toBe("numeric")
    expect(day.props.autoCorrect).toBe(false)
    expect(day.props.placeholder).toBe("––")
    const slash = screen.getAllByText("/", { includeHiddenElements: true })[0]
    expect(
      slash.props.accessibilityElementsHidden ||
        slash.props.importantForAccessibility === "no-hide-descendants"
    ).toBe(true)
  })

  test("a screen reader's increment and decrement step a segment", async () => {
    const onValueChange = jest.fn()
    await render(
      <DateInput
        locale="en-US"
        defaultValue="2026-11-04"
        onValueChange={onValueChange}
      />
    )
    await fireEvent(segment("day"), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    })
    expect(segment("day").props.value).toBe("05")
    expect(onValueChange).toHaveBeenCalledWith(
      "2026-11-05",
      expect.objectContaining({ reason: "step-key", source: "virtual" })
    )
    await fireEvent(segment("month"), "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    })
    expect(segment("month").props.value).toBe("10")
  })

  test("a controller sets the value and focuses a segment", async () => {
    const controller = createDateInputController()
    await render(<DateInput locale="en-US" controller={controller} />)
    await act(() => controller.setValue("2026-02-03"))
    expect(segment("day").props.value).toBe("03")
    await act(() => controller.focus("year"))
    expect(focused()).toEqual(["year"])
  })

  test("a press around the segments starts editing one", async () => {
    await render(<DateInput locale="en-US" testID="root" />)
    await fireEvent(screen.getByTestId("root"), "responderRelease", {
      nativeEvent: { pageX: 0 },
    })
    expect(focused()).toEqual(["month"])
  })

  test("a read-only input can't be typed in or stepped", async () => {
    await render(
      <DateInput locale="en-US" defaultValue="2026-11-04" readOnly />
    )
    expect(segment("day").props.editable).toBe(false)
    expect(segment("day").props.accessibilityState).toMatchObject({
      disabled: true,
    })
    await fireEvent.changeText(segment("day"), "5")
    expect(segment("day").props.value).toBe("04")
  })

  test("a disabled FieldSet disables every segment", async () => {
    await render(
      <FieldSet disabled>
        <DateInput locale="en-US" />
      </FieldSet>
    )
    expect(segment("month").props.editable).toBe(false)
    expect(segment("year").props.editable).toBe(false)
  })

  test("a Field's label and description follow each segment's name, and a press on the label starts editing", async () => {
    await render(
      <Field>
        <FieldLabel>Birthday</FieldLabel>
        <DateInput locale="en-US" />
        <FieldDescription>Day and month will do.</FieldDescription>
      </Field>
    )
    expect(segment("month").props.accessibilityHint).toBe(
      "Birthday Day and month will do."
    )
    await fireEvent.press(screen.getByText("Birthday"))
    expect(focused()).toEqual(["month"])
  })

  test("an aria-label on the root follows each segment's name", async () => {
    await render(<DateInput locale="en-US" aria-label="Start date" />)
    expect(segment("day").props.accessibilityHint).toBe("Start date")
  })

  test("its children can render the segments from its state", async () => {
    await render(
      <DateInput locale="en-US" defaultValue="2026-11-04">
        {(state) => <Text>{state.value}</Text>}
      </DateInput>
    )
    expect(screen.getByText("2026-11-04")).toBeTruthy()
  })
})

describe("TimeInput", () => {
  test("typing hours and minutes, then a letter for AM or PM, reports the time", async () => {
    const onValueChange = jest.fn()
    await render(<TimeInput locale="en-US" onValueChange={onValueChange} />)
    await fireEvent.changeText(segment("hour"), "2")
    expect(focused()).toEqual(["minute"])
    await fireEvent.changeText(segment("minute"), "30")
    expect(focused()).toEqual(["minute", "AM/PM"])
    expect(segment("AM/PM").props.inputMode).toBe("text")
    await fireEvent.changeText(segment("AM/PM"), "p")
    expect(segment("AM/PM").props.value).toBe("PM")
    expect(onValueChange).toHaveBeenCalledWith(
      "14:30",
      expect.objectContaining({ reason: "input-change", source: "keyboard" })
    )
  })
})
