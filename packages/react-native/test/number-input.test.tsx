import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import { Platform, Text, TextInput, type TextInputInstance } from "react-native"
import { Field, FieldLabel, FieldSet } from "../src/field"
import {
  createNumberInputController,
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
  NumberInputScrubArea,
} from "../src/number-input"

afterEach(() => {
  jest.clearAllMocks()
  jest.useRealTimers()
})

function Amount(props: React.ComponentProps<typeof NumberInput>) {
  return (
    <NumberInput locale="en-US" {...props}>
      <NumberInputScrubArea testID="scrub" pixelsPerStep={4}>
        <Text>Amount</Text>
      </NumberInputScrubArea>
      <NumberInputGroup testID="group">
        <NumberInputDecrement aria-label="Decrease" testID="decrement" />
        <NumberInputControl aria-label="Amount" />
        <NumberInputIncrement aria-label="Increase" testID="increment" />
      </NumberInputGroup>
    </NumberInput>
  )
}

const field = () => screen.getByLabelText("Amount")
const increment = () => screen.getByTestId("increment")
const decrement = () => screen.getByTestId("decrement")
const select = (start: number, end = start) =>
  fireEvent(field(), "selectionChange", {
    nativeEvent: { selection: { start, end } },
  })

describe("NumberInput", () => {
  test("typing a number reports it from the keyboard, and leaving the field commits it formatted, as typed", async () => {
    const onValueChange = jest.fn()
    const onValueCommit = jest.fn()
    await render(
      <Amount onValueChange={onValueChange} onValueCommit={onValueCommit} />
    )
    await fireEvent(field(), "focus")
    await fireEvent.changeText(field(), "1234")
    expect(field().props.value).toBe("1234")
    expect(onValueChange).toHaveBeenCalledWith(
      1234,
      expect.objectContaining({ reason: "input-change", source: "keyboard" })
    )
    await fireEvent(field(), "blur")
    expect(field().props.value).toBe("1,234")
    expect(onValueCommit).toHaveBeenCalledWith(
      1234,
      expect.objectContaining({ reason: "input-change" })
    )
  })

  test("an edit the web would refuse is written back at once, with the selection it had", async () => {
    const onValueChange = jest.fn()
    await render(<Amount defaultValue={12} onValueChange={onValueChange} />)
    await fireEvent(field(), "focus")
    await select(1)
    expect(field().props.selection).toBeUndefined()
    await fireEvent.changeText(field(), "1a2")
    expect(field().props.value).toBe("12")
    expect(field().props.selection).toEqual({ start: 1, end: 1 })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test("the refused text's caret keeps the selection written back, and the next caret the user puts lets go of it", async () => {
    await render(<Amount defaultValue={123} />)
    await fireEvent(field(), "focus")
    await select(0, 3)
    await fireEvent.changeText(field(), "x")
    expect(field().props.value).toBe("123")
    expect(field().props.selection).toEqual({ start: 0, end: 3 })
    await select(1)
    expect(field().props.selection).toEqual({ start: 0, end: 3 })
    await select(2)
    expect(field().props.selection).toBeUndefined()
  })

  test("typing after a corrected edit lets go of its selection", async () => {
    await render(<Amount defaultValue={12} />)
    await fireEvent(field(), "focus")
    await select(2)
    await fireEvent.changeText(field(), "12a")
    expect(field().props.selection).toEqual({ start: 2, end: 2 })
    await fireEvent.changeText(field(), "123")
    expect(field().props.value).toBe("123")
    expect(field().props.selection).toBeUndefined()
  })

  test("Enter commits what's typed", async () => {
    const onValueCommit = jest.fn()
    await render(<Amount max={100} onValueCommit={onValueCommit} />)
    await fireEvent(field(), "focus")
    await fireEvent.changeText(field(), "250")
    await fireEvent(field(), "submitEditing")
    expect(field().props.value).toBe("100")
    expect(onValueCommit).toHaveBeenCalledWith(
      100,
      expect.objectContaining({ reason: "input-commit" })
    )
  })

  test("the keyboard has the keys the number needs, with no correction", async () => {
    await render(
      <>
        <Amount min={0} />
        <NumberInput min={0} step={0.5}>
          <NumberInputControl aria-label="Half" />
        </NumberInput>
        <NumberInput>
          <NumberInputControl aria-label="Signed" />
        </NumberInput>
      </>
    )
    expect(field().props).toMatchObject({
      inputMode: "numeric",
      autoCorrect: false,
      spellCheck: false,
      autoComplete: "off",
    })
    expect(screen.getByLabelText("Half").props.inputMode).toBe("decimal")
    expect(screen.getByLabelText("Signed").props.inputMode).toBe(
      Platform.OS === "ios" ? "text" : "numeric"
    )
  })

  test("a press on a step button steps as the finger goes down, and commits as it lifts", async () => {
    const onValueChange = jest.fn()
    const onValueCommit = jest.fn()
    await render(
      <Amount
        defaultValue={5}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />
    )
    await fireEvent(increment(), "pressIn")
    expect(field().props.value).toBe("6")
    expect(onValueChange).toHaveBeenCalledWith(
      6,
      expect.objectContaining({ reason: "increment-press", source: "touch" })
    )
    expect(onValueCommit).not.toHaveBeenCalled()
    await fireEvent(increment(), "pressOut")
    await fireEvent.press(increment())
    expect(field().props.value).toBe("6")
    expect(onValueCommit).toHaveBeenCalledTimes(1)
    expect(onValueCommit).toHaveBeenCalledWith(
      6,
      expect.objectContaining({ reason: "increment-press" })
    )
  })

  test("a held step button repeats from the touch until it lifts", async () => {
    jest.useFakeTimers()
    const onValueChange = jest.fn()
    await render(<Amount defaultValue={0} onValueChange={onValueChange} />)
    await fireEvent(decrement(), "pressIn")
    await act(() => jest.advanceTimersByTime(400 + 60 + 30))
    expect(field().props.value).toBe("-3")
    expect(onValueChange).toHaveBeenLastCalledWith(
      -3,
      expect.objectContaining({ reason: "decrement-press", source: "touch" })
    )
    await fireEvent(decrement(), "pressOut")
    await act(() => jest.advanceTimersByTime(1000))
    expect(field().props.value).toBe("-3")
  })

  test("a step button with nothing to step to is disabled", async () => {
    await render(<Amount defaultValue={10} max={10} />)
    expect(increment().props.accessibilityState).toMatchObject({
      disabled: true,
    })
    expect(decrement().props.accessibilityState?.disabled).toBeFalsy()
  })

  test("a screen reader's activation of a step button steps once and commits", async () => {
    const onValueCommit = jest.fn()
    await render(<Amount defaultValue={2} onValueCommit={onValueCommit} />)
    await fireEvent.press(decrement())
    expect(field().props.value).toBe("1")
    expect(onValueCommit).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ reason: "decrement-press" })
    )
  })

  test("a drag across the scrub area steps the value and commits once it lifts", async () => {
    const onValueCommit = jest.fn()
    await render(<Amount defaultValue={0} onValueCommit={onValueCommit} />)
    const scrub = screen.getByTestId("scrub")
    const touch = (pageX: number) => ({
      nativeEvent: { identifier: 1, pageX, pageY: 0, touches: [] },
      target: null,
    })
    expect(scrub.props.onStartShouldSetResponder()).toBe(true)
    await fireEvent(scrub, "responderGrant", touch(0))
    await fireEvent(scrub, "responderMove", touch(9))
    expect(field().props.value).toBe("2")
    await fireEvent(scrub, "responderRelease", touch(9))
    expect(onValueCommit).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ reason: "scrub", source: "touch" })
    )
  })

  test("a read-only field can't be typed in or stepped", async () => {
    await render(<Amount defaultValue={3} readOnly />)
    expect(field().props.editable).toBe(false)
    expect(field().props.accessibilityState).toMatchObject({ disabled: true })
    expect(increment().props.accessibilityState).toMatchObject({
      disabled: true,
    })
    await fireEvent.press(increment())
    expect(field().props.value).toBe("3")
  })

  test("a disabled FieldSet disables the field and its buttons", async () => {
    await render(
      <FieldSet disabled>
        <Amount defaultValue={3} />
      </FieldSet>
    )
    expect(field().props.editable).toBe(false)
    expect(increment().props.accessibilityState).toMatchObject({
      disabled: true,
    })
  })

  test("a Field's label names the field, and a press on it starts editing", async () => {
    const ref = createRef<TextInputInstance>()
    await render(
      <>
        <Field>
          <FieldLabel>Quantity</FieldLabel>
          <NumberInput>
            <NumberInputControl />
          </NumberInput>
        </Field>
        <TextInput ref={ref} />
      </>
    )
    const quantity = screen.getByLabelText("Quantity")
    expect(quantity.type).toBe("TextInput")
    await fireEvent.press(screen.getByText("Quantity"))
    expect(ref.current!.focus).toHaveBeenCalled()
  })

  test("a controller steps it and starts editing it", async () => {
    const ref = createRef<TextInputInstance>()
    const controller = createNumberInputController()
    await render(
      <>
        <Amount defaultValue={1} controller={controller} />
        <TextInput ref={ref} />
      </>
    )
    await act(() => controller.increment({ large: true }))
    expect(field().props.value).toBe("11")
    await act(() => controller.focus())
    expect(ref.current!.focus).toHaveBeenCalled()
  })

  test("a controlled value shows, and a refused change puts the text back", async () => {
    await render(<Amount value={7} onValueChange={(_, details) => details.cancel()} />)
    await fireEvent(field(), "focus")
    await fireEvent.changeText(field(), "")
    expect(field().props.value).toBe("")
    await fireEvent(field(), "blur")
    expect(field().props.value).toBe("7")
  })
})
