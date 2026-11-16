import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import {
  type HostInstance,
  Text,
  TextInput,
  type TextInputInstance,
  View,
} from "react-native"
import { Field, FieldDescription, FieldLabel, FieldSet } from "../src/field"
import {
  createOTPInputController,
  OTPInput,
  OTPInputGroup,
  OTPInputSlot,
} from "../src/otp-input"

// Jest's TextInput mock shares one focus mock between instances, so any
// field's ref reads it.
afterEach(() => jest.clearAllMocks())

// Slots 48 wide, 8 apart, in a field 4 in from the root's edge, where its
// border ends. Jest's views share one measureLayout mock.
let measureLayout: jest.Mock | undefined
beforeEach(async () => {
  const ref = createRef<HostInstance>()
  await render(<View ref={ref} />)
  measureLayout = ref.current!.measureLayout as unknown as jest.Mock
  measureLayout.mockImplementation(function (
    this: { props: { testID?: string } },
    _root: unknown,
    onSuccess: (x: number, y: number, width: number, height: number) => void
  ) {
    const index = /^slot-(\d)$/.exec(this.props.testID ?? "")?.[1]
    onSuccess(index === undefined ? 4 : 4 + Number(index) * 56, 4, 48, 48)
  })
})
afterEach(() => measureLayout?.mockReset())

async function renderWithFocus(element: React.ReactElement) {
  const ref = createRef<TextInputInstance>()
  await render(
    <>
      {element}
      <TextInput ref={ref} />
    </>
  )
  return ref.current!.focus as jest.Mock
}

function Code(props: React.ComponentProps<typeof OTPInput>) {
  return (
    <OTPInput aria-label="Code" maxLength={4} {...props}>
      <OTPInputGroup>
        {[0, 1, 2, 3].map((index) => (
          <OTPInputSlot key={index} index={index} testID={`slot-${index}`}>
            {(slot) => (
              <Text testID={`char-${index}`}>
                {`${slot.char ?? ""}${slot.active ? "*" : ""}`}
              </Text>
            )}
          </OTPInputSlot>
        ))}
      </OTPInputGroup>
    </OTPInput>
  )
}

const field = () => screen.getByLabelText("Code")
const slot = (index: number) =>
  screen.getByTestId(`slot-${index}`, { includeHiddenElements: true })
const select = (start: number, end = start) =>
  fireEvent(field(), "selectionChange", {
    nativeEvent: { selection: { start, end } },
  })
const tapAt = async (locationX: number) => {
  const event = { nativeEvent: { locationX, locationY: 24 } }
  await fireEvent(field(), "pressIn", event)
  await fireEvent(field(), "pressOut", event)
  await fireEvent(field(), "press", event)
}
const tap = (index: number) => tapAt(index * 56 + 24)
const drawn = () =>
  [0, 1, 2, 3]
    .map(
      (index) =>
        screen.getByTestId(`char-${index}`, { includeHiddenElements: true })
          .props.children
    )
    .join("|")

describe("OTPInput", () => {
  test("typing a code fills the slots and reports input-change from the keyboard", async () => {
    const onValueChange = jest.fn()
    await render(<Code onValueChange={onValueChange} />)
    await fireEvent.changeText(field(), "12")
    expect(field().props.value).toBe("12")
    expect(drawn()).toBe("1|2||")
    expect(onValueChange).toHaveBeenCalledWith(
      "12",
      expect.objectContaining({ reason: "input-change", source: "keyboard" })
    )
  })

  test("the field offers one-time codes on a numeric keyboard, with no correction or capitals, and holds no maxLength that would cut a pasted code", async () => {
    await render(<Code />)
    expect(field().props).toMatchObject({
      autoComplete: "one-time-code",
      inputMode: "numeric",
      autoCapitalize: "none",
      autoCorrect: false,
      spellCheck: false,
    })
    expect(field().props.maxLength).toBeUndefined()
  })

  test("the slots are drawn only: hidden from screen readers and out of keyboard order", async () => {
    await render(<Code />)
    expect(slot(0).props).toMatchObject({ accessible: false, focusable: false })
    expect(screen.queryByTestId("slot-0")).toBeNull()
  })

  test("on focus the empty slot after the code is active, and the field's selection follows", async () => {
    await render(<Code defaultValue="12" />)
    expect(field().props.selection).toBeUndefined()
    await fireEvent(field(), "focus")
    expect(drawn()).toBe("1|2|*|")
    expect(field().props.selection).toEqual({ start: 2, end: 2 })
    await fireEvent(field(), "blur")
    expect(drawn()).toBe("1|2||")
  })

  test("a caret the user puts on a character selects that character", async () => {
    await render(<Code defaultValue="123" />)
    await fireEvent(field(), "focus")
    await select(1)
    expect(field().props.selection).toEqual({ start: 1, end: 2 })
    expect(drawn()).toBe("1|2*|3|")
  })

  test("a tap on the focused field selects the slot under it through the selection prop, and an empty slot past the code selects the one after the code", async () => {
    await render(<Code defaultValue="12" />)
    await fireEvent(field(), "focus")
    await tap(0)
    expect(field().props.selection).toEqual({ start: 0, end: 1 })
    expect(drawn()).toBe("1*|2||")
    await tap(1)
    expect(drawn()).toBe("1|2*||")
    await tap(3)
    expect(field().props.selection).toEqual({ start: 2, end: 2 })
    expect(drawn()).toBe("1|2|*|")
  })

  test("a tap between two slots selects the nearer one", async () => {
    await render(<Code defaultValue="123" />)
    await fireEvent(field(), "focus")
    await tapAt(56 + 48 + 5)
    expect(drawn()).toBe("1|2|3*|")
    await tapAt(56 + 48 + 1)
    expect(drawn()).toBe("1|2*|3|")
  })

  test("the slot a tap selects wins over the caret the field puts under the finger, and a later caret move still counts", async () => {
    await render(<Code defaultValue="123" />)
    await fireEvent(field(), "focus")
    await tap(2)
    await select(1)
    expect(field().props.selection).toEqual({ start: 2, end: 3 })
    expect(drawn()).toBe("1|2|3*|")
    await select(0)
    expect(field().props.selection).toEqual({ start: 0, end: 1 })
  })

  test("on Android, the echo of the tapped slot's selection doesn't let the finger's caret through", async () => {
    await render(<Code defaultValue="123" />)
    await fireEvent(field(), "focus")
    const event = { nativeEvent: { locationX: 56 + 24, locationY: 24 } }
    await fireEvent(field(), "pressIn", event)
    await select(1, 2)
    await select(3)
    await fireEvent(field(), "pressOut", event)
    await fireEvent(field(), "press", event)
    expect(field().props.selection).toEqual({ start: 1, end: 2 })
    expect(drawn()).toBe("1|2*|3|")
  })

  test("a long press on the unfocused field selects no slot, so the field's own Paste menu stays", async () => {
    const focus = await renderWithFocus(<Code defaultValue="123" />)
    const event = { nativeEvent: { locationX: 56 + 24, locationY: 24 } }
    await fireEvent(field(), "pressIn", event)
    await fireEvent(field(), "longPress", event)
    await fireEvent(field(), "pressOut", event)
    expect(focus).not.toHaveBeenCalled()
    await fireEvent(field(), "focus")
    expect(field().props.selection).toEqual({ start: 3, end: 3 })
  })

  test("a tap on the unfocused field focuses it, then selects the slot under it over the carets the field reports", async () => {
    const focus = await renderWithFocus(<Code defaultValue="123" />)
    await tap(1)
    expect(focus).toHaveBeenCalledTimes(1)
    expect(field().props.selection).toBeUndefined()
    await fireEvent(field(), "focus")
    expect(field().props.selection).toEqual({ start: 1, end: 2 })
    // Android reports the caret it put at the end on focus, then the tap's.
    await select(3)
    await select(0)
    expect(field().props.selection).toEqual({ start: 1, end: 2 })
    await fireEvent.changeText(field(), "173")
    await select(2)
    expect(drawn()).toBe("1|7|3*|")
  })

  test("a press that leaves the field before it ends selects nothing", async () => {
    const focus = await renderWithFocus(<Code defaultValue="123" />)
    const event = { nativeEvent: { locationX: 24, locationY: 24 } }
    await fireEvent(field(), "pressIn", event)
    await fireEvent(field(), "pressOut", event)
    expect(focus).not.toHaveBeenCalled()
    await fireEvent(field(), "focus")
    expect(field().props.selection).toEqual({ start: 3, end: 3 })
  })

  test("the field is drawn over the slots, so a long press anywhere on the code reaches it", async () => {
    await render(<Code />)
    const root = field().parent!
    const children = root.children.filter((child) => typeof child !== "string")
    expect(children.at(-1) === field()).toBe(true)
  })

  test("a change its controlled owner doesn't take leaves the active slot within the code", async () => {
    await render(<Code value="12" onValueChange={() => {}} />)
    await fireEvent(field(), "focus")
    await fireEvent.changeText(field(), "123")
    await select(3)
    expect(field().props.value).toBe("12")
    expect(field().props.selection).toEqual({ start: 2, end: 2 })
    expect(drawn()).toBe("1|2|*|")
  })

  test("typing over a selected slot replaces that character, and a deletion leaves the caret where it was", async () => {
    await render(<Code defaultValue="123" />)
    await fireEvent(field(), "focus")
    await tap(1)
    await fireEvent.changeText(field(), "193")
    await select(2)
    expect(drawn()).toBe("1|9|3*|")
    await fireEvent.changeText(field(), "19")
    await select(2)
    expect(field().props.selection).toEqual({ start: 2, end: 2 })
    expect(drawn()).toBe("1|9|*|")
  })

  test("text that isn't a code goes back, and an autofilled or pasted code is cleaned and replaces it", async () => {
    const onValueChange = jest.fn()
    await render(<Code defaultValue="12" onValueChange={onValueChange} />)
    await fireEvent(field(), "focus")
    await fireEvent.changeText(field(), "12a")
    expect(field().props.value).toBe("12")
    expect(onValueChange).not.toHaveBeenCalled()
    await fireEvent.changeText(field(), "1298 76")
    expect(field().props.value).toBe("9876")
    await fireEvent.changeText(field(), "9876 is your code")
    expect(field().props.value).toBe("9876")
  })

  test("a refused character keeps the selection, which the field gets back", async () => {
    await render(<Code defaultValue="123" />)
    await fireEvent(field(), "focus")
    await tap(1)
    await fireEvent.changeText(field(), "1a3")
    await select(2)
    expect(field().props.value).toBe("123")
    expect(field().props.selection).toEqual({ start: 1, end: 2 })
  })

  test("filling every slot commits the code", async () => {
    const onValueCommit = jest.fn()
    await render(<Code onValueCommit={onValueCommit} />)
    await fireEvent.changeText(field(), "123")
    expect(onValueCommit).not.toHaveBeenCalled()
    await fireEvent.changeText(field(), "1234")
    expect(onValueCommit).toHaveBeenCalledWith(
      "1234",
      expect.objectContaining({ reason: "input-change" })
    )
  })

  test("a canceled change keeps the code", async () => {
    await render(<Code onValueChange={(_, details) => details.cancel()} />)
    await fireEvent.changeText(field(), "1")
    expect(field().props.value).toBe("")
  })

  test("a controlled code follows its owner", async () => {
    const { rerender } = await render(<Code value="12" />)
    await fireEvent.changeText(field(), "123")
    expect(field().props.value).toBe("12")
    await rerender(<Code value="56" />)
    expect(drawn()).toBe("5|6||")
  })

  test("a disabled code can't be edited, says so, and ignores taps", async () => {
    await render(<Code disabled defaultValue="1" />)
    expect(field().props.editable).toBe(false)
    expect(field().props.accessibilityState).toMatchObject({ disabled: true })
    await tap(0)
    expect(field().props.selection).toBeUndefined()
  })

  test("a read-only code can't be edited, and reads as disabled since React Native has no read-only field", async () => {
    await render(<Code readOnly defaultValue="1" />)
    expect(field().props.editable).toBe(false)
    expect(field().props.accessibilityState).toMatchObject({ disabled: true })
  })

  test("the controller reads, writes and clears the code and focuses the field", async () => {
    const controller = createOTPInputController()
    const focus = await renderWithFocus(<Code controller={controller} />)
    await act(() => {
      controller.setValue("12-34")
    })
    expect(drawn()).toBe("1|2|3|4")
    expect(controller.getValue()).toBe("1234")
    await act(() => {
      controller.clear()
    })
    expect(field().props.value).toBe("")
    await act(() => controller.focus())
    expect(focus).toHaveBeenCalledTimes(1)
  })

  test("inside a Field, the label names the field, the description describes it, and a press on the label starts editing", async () => {
    const focus = await renderWithFocus(
      <Field>
        <FieldLabel>Verification code</FieldLabel>
        <OTPInput maxLength={4}>
          <OTPInputGroup>
            <OTPInputSlot index={0} />
          </OTPInputGroup>
        </OTPInput>
        <FieldDescription>Sent to your phone.</FieldDescription>
      </Field>
    )
    await act(() => new Promise((resolve) => setTimeout(resolve)))
    const code = screen.getByLabelText("Verification code")
    expect(code.props.accessibilityHint).toBe("Sent to your phone.")
    await fireEvent.press(screen.getByText("Verification code"))
    expect(focus).toHaveBeenCalledTimes(1)
  })

  test("a disabled FieldSet around it disables it", async () => {
    await render(
      <FieldSet disabled>
        <Code />
      </FieldSet>
    )
    expect(field().props.editable).toBe(false)
  })
})
