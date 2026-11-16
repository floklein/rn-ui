import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import { AccessibilityInfo, Text, type TextInputInstance } from "react-native"
import {
  createInputController,
  Input,
  InputClear,
  InputGroup,
} from "../src/input"

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

// Jest's TextInput mock shares one focus mock between instances.
afterEach(() => jest.clearAllMocks())

describe("Input", () => {
  test("typing changes the value and reports input-change from the keyboard", async () => {
    const onValueChange = jest.fn()
    await render(
      <Input
        aria-label="Website"
        defaultValue="example"
        onValueChange={onValueChange}
      />
    )
    const field = screen.getByLabelText("Website")
    expect(field).toHaveDisplayValue("example")
    await fireEvent.changeText(field, "example.com")
    expect(field).toHaveDisplayValue("example.com")
    expect(onValueChange).toHaveBeenCalledTimes(1)
    const [value, details] = onValueChange.mock.calls[0]
    expect(value).toBe("example.com")
    expect(details).toMatchObject({
      reason: "input-change",
      source: "keyboard",
    })
  })

  test("a canceled change puts the text back, and a controlled field waits for its value", async () => {
    await render(
      <>
        <Input
          aria-label="Canceled"
          defaultValue="kept"
          onValueChange={(_value, details) => details.cancel()}
        />
        <Input aria-label="Controlled" value="fixed" onValueChange={() => {}} />
      </>
    )
    await fireEvent.changeText(screen.getByLabelText("Canceled"), "lost")
    expect(screen.getByLabelText("Canceled")).toHaveDisplayValue("kept")
    await fireEvent.changeText(screen.getByLabelText("Controlled"), "typed")
    expect(screen.getByLabelText("Controlled")).toHaveDisplayValue("fixed")
  })

  test("a controller sets and clears the value with the imperative reason", async () => {
    const controller = createInputController()
    const onValueChange = jest.fn()
    await render(
      <Input
        aria-label="Search"
        controller={controller}
        onValueChange={onValueChange}
      />
    )
    await act(async () => controller.setValue("lisbon"))
    expect(screen.getByLabelText("Search")).toHaveDisplayValue("lisbon")
    expect(controller.getValue()).toBe("lisbon")
    await act(async () => controller.clear())
    expect(screen.getByLabelText("Search")).toHaveDisplayValue("")
    expect(
      onValueChange.mock.calls.map(([, details]) => details.reason)
    ).toEqual(["imperative", "imperative"])
  })

  test("a disabled field can't be edited and is disabled for the screen reader; a read-only one can't be edited, so it reads as disabled too", async () => {
    await render(
      <>
        <Input aria-label="Disabled" disabled />
        <Input aria-label="Read-only" readOnly />
      </>
    )
    expect(screen.getByLabelText("Disabled").props.editable).toBe(false)
    expect(screen.getByLabelText("Disabled")).toBeDisabled()
    expect(screen.getByLabelText("Read-only").props.editable).toBe(false)
    expect(
      screen.getByLabelText("Read-only").props.accessibilityState.disabled
    ).toBe(true)
  })

  test("its state says whether it's filled, disabled, read-only and required", async () => {
    await render(
      <Input
        aria-label="Name"
        required
        style={(state) => ({ opacity: state.filled ? 1 : 0.5 })}
        testID="name"
      />
    )
    expect(screen.getByTestId("name")).toHaveStyle({ opacity: 0.5 })
    await fireEvent.changeText(screen.getByTestId("name"), "Leila")
    expect(screen.getByTestId("name")).toHaveStyle({ opacity: 1 })
  })

  test("focus() starts editing and moves the screen reader to the field", async () => {
    const controller = createInputController()
    const ref = createRef<TextInputInstance>()
    await render(<Input aria-label="Email" controller={controller} ref={ref} />)
    await act(async () => controller.focus())
    expect(ref.current!.focus).toHaveBeenCalledTimes(1)
    expect(sendAccessibilityEvent).toHaveBeenCalledWith(ref.current, "focus")
  })
})

describe("InputGroup", () => {
  test("its Clear shows while the field has text, and a press empties the field with clear-press and starts editing", async () => {
    const onValueChange = jest.fn()
    const ref = createRef<TextInputInstance>()
    await render(
      <InputGroup>
        <Input
          aria-label="Search"
          defaultValue="lisbon"
          onValueChange={onValueChange}
          ref={ref}
        />
        <InputClear aria-label="Clear search" />
      </InputGroup>
    )
    await fireEvent.press(screen.getByRole("button", { name: "Clear search" }))
    expect(screen.getByLabelText("Search")).toHaveDisplayValue("")
    expect(onValueChange).toHaveBeenCalledWith(
      "",
      expect.objectContaining({ reason: "clear-press", source: "touch" })
    )
    expect(ref.current!.focus).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull()
    await fireEvent.changeText(screen.getByLabelText("Search"), "porto")
    expect(
      screen.getByRole("button", { name: "Clear search" })
    ).toBeOnTheScreen()
  })

  test("its Clear stays hidden while the field is disabled or read-only", async () => {
    await render(
      <>
        <InputGroup>
          <Input aria-label="Disabled" defaultValue="text" disabled />
          <InputClear aria-label="Clear disabled" />
        </InputGroup>
        <InputGroup>
          <Input aria-label="Read-only" defaultValue="text" readOnly />
          <InputClear aria-label="Clear read-only" />
        </InputGroup>
      </>
    )
    expect(screen.queryByRole("button")).toBeNull()
  })

  test("a press on its text starts editing the field, and it isn't an accessible element itself", async () => {
    const ref = createRef<TextInputInstance>()
    await render(
      <InputGroup testID="group">
        <Text>https://</Text>
        <Input aria-label="Website" ref={ref} />
      </InputGroup>
    )
    await fireEvent.press(screen.getByText("https://"))
    expect(ref.current!.focus).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("group").props.accessible).toBe(false)
  })

  test("its state follows the field's", async () => {
    await render(
      <InputGroup
        testID="group"
        style={(state) => ({ opacity: state.filled ? 1 : 0.5 })}
      >
        <Input aria-label="City" />
      </InputGroup>
    )
    expect(screen.getByTestId("group")).toHaveStyle({ opacity: 0.5 })
    await fireEvent.changeText(screen.getByLabelText("City"), "Porto")
    expect(screen.getByTestId("group")).toHaveStyle({ opacity: 1 })
  })

  test("a field that leaves the group leaves it empty, so its Clear goes", async () => {
    const { rerender } = await render(
      <InputGroup>
        <Input aria-label="Search" defaultValue="lisbon" />
        <InputClear aria-label="Clear search" />
      </InputGroup>
    )
    expect(
      screen.getByRole("button", { name: "Clear search" })
    ).toBeOnTheScreen()
    await rerender(
      <InputGroup>
        <InputClear aria-label="Clear search" />
      </InputGroup>
    )
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull()
  })
})
