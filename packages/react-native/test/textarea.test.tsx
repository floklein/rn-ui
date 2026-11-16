import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import { AccessibilityInfo, type TextInputInstance } from "react-native"
import { createInputController, Textarea } from "../src/textarea"

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

// Jest's TextInput mock shares one focus mock between instances.
afterEach(() => jest.clearAllMocks())

describe("Textarea", () => {
  test("is a multiline field where Enter adds a line and submits nothing", async () => {
    const onValueChange = jest.fn()
    await render(
      <Textarea
        aria-label="Message"
        defaultValue="Hello"
        onValueChange={onValueChange}
      />
    )
    const field = screen.getByLabelText("Message")
    expect(field.props.multiline).toBe(true)
    expect(field.props.submitBehavior ?? "newline").toBe("newline")
    await fireEvent.changeText(field, "Hello\nthere")
    expect(field).toHaveDisplayValue("Hello\nthere")
    expect(onValueChange).toHaveBeenCalledWith(
      "Hello\nthere",
      expect.objectContaining({ reason: "input-change", source: "keyboard" })
    )
  })

  test("focus() starts editing and moves the screen reader to the field", async () => {
    const controller = createInputController()
    const ref = createRef<TextInputInstance>()
    await render(
      <Textarea aria-label="Notes" controller={controller} ref={ref} />
    )
    await act(async () => controller.focus())
    expect(ref.current!.focus).toHaveBeenCalledTimes(1)
    expect(sendAccessibilityEvent).toHaveBeenCalledWith(ref.current, "focus")
  })
})
