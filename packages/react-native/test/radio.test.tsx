import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { AccessibilityInfo } from "react-native"
import {
  createRadioGroupController,
  Radio,
  RadioGroup,
  type RadioGroupOptions,
  RadioIndicator,
} from "../src/radio"

type Done = () => void

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

beforeEach(() => jest.useFakeTimers())
afterEach(() => {
  jest.useRealTimers()
  sendAccessibilityEvent.mockClear()
})

const radio = (name: string) => screen.getByRole("radio", { name })
const checkedOf = (name: string) =>
  radio(name).props.accessibilityState?.checked
const indicator = (value: string) =>
  screen.queryByTestId(`indicator-${value}`, { includeHiddenElements: true })

function Sizes({
  disabledValue,
  onExit,
  ...props
}: RadioGroupOptions & {
  disabledValue?: string
  onExit?: (done: Done) => void
}) {
  return (
    <RadioGroup aria-label="Size" {...props}>
      {["small", "medium", "large"].map((value) => (
        <Radio
          key={value}
          value={value}
          aria-label={value}
          disabled={value === disabledValue}
        >
          <RadioIndicator testID={`indicator-${value}`} onExit={onExit} />
        </Radio>
      ))}
    </RadioGroup>
  )
}

describe("Radio", () => {
  test("a press checks a radio and unchecks the others, from a touch and with no event", async () => {
    const onValueChange = jest.fn()
    await render(<Sizes defaultValue="small" onValueChange={onValueChange} />)
    expect(screen.getAllByRole("radio")).toHaveLength(3)
    expect(checkedOf("small")).toBe(true)
    await fireEvent.press(radio("large"))
    expect(checkedOf("large")).toBe(true)
    expect(checkedOf("small")).toBe(false)
    const [value, details] = onValueChange.mock.calls[0]
    expect(value).toBe("large")
    expect(details).toMatchObject({ reason: "item-press", source: "touch" })
    expect(details.event).toBeUndefined()
  })

  test("only the checked radio's indicator is rendered", async () => {
    await render(<Sizes defaultValue="medium" />)
    expect(indicator("medium")).not.toBeNull()
    expect(indicator("small")).toBeNull()
    await fireEvent.press(radio("small"))
    expect(indicator("small")).not.toBeNull()
    expect(indicator("medium")).toBeNull()
  })

  test("an indicator with onExit stays mounted until done is called", async () => {
    const onExit = jest.fn<void, [Done]>()
    await render(<Sizes defaultValue="medium" onExit={onExit} />)
    await fireEvent.press(radio("small"))
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(indicator("medium")).not.toBeNull()
    await act(() => onExit.mock.calls[0][0]())
    expect(indicator("medium")).toBeNull()
  })

  test("every radio stays in the keyboard order, not only the checked one", async () => {
    await render(<Sizes defaultValue="medium" />)
    for (const name of ["small", "medium", "large"]) {
      expect(radio(name).props.focusable).not.toBe(false)
      expect(radio(name).props).not.toHaveProperty("tabIndex")
    }
  })

  test("a disabled radio is disabled and ignores a press, and a disabled group disables them all", async () => {
    const onValueChange = jest.fn()
    const { rerender } = await render(
      <Sizes disabledValue="large" onValueChange={onValueChange} />
    )
    expect(radio("large")).toBeDisabled()
    expect(radio("small")).not.toBeDisabled()
    await fireEvent.press(radio("large"))
    expect(onValueChange).not.toHaveBeenCalled()
    await rerender(<Sizes disabled onValueChange={onValueChange} />)
    for (const name of ["small", "medium", "large"]) {
      expect(radio(name)).toBeDisabled()
    }
    await fireEvent.press(radio("small"))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test("a read-only group keeps its radios enabled but changes nothing", async () => {
    const onValueChange = jest.fn()
    await render(
      <Sizes readOnly defaultValue="small" onValueChange={onValueChange} />
    )
    expect(radio("medium")).not.toBeDisabled()
    await fireEvent.press(radio("medium"))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(checkedOf("small")).toBe(true)
  })

  test("a change can be cancelled, and a controlled group shows what its parent passes", async () => {
    const { rerender } = await render(
      <Sizes onValueChange={(_value, details) => details.cancel()} />
    )
    await fireEvent.press(radio("medium"))
    expect(checkedOf("medium")).toBe(false)
    await rerender(<Sizes value="small" />)
    await fireEvent.press(radio("medium"))
    expect(checkedOf("small")).toBe(true)
    await rerender(<Sizes value="large" />)
    expect(checkedOf("large")).toBe(true)
  })

  test("its controller's focus requests accessibility focus on the checked radio", async () => {
    // The group sets its tab stop in a microtask, which fake timers hold back.
    jest.useRealTimers()
    const controller = createRadioGroupController()
    await render(<Sizes defaultValue="medium" controller={controller} />)
    await act(() => controller.focus())
    expect(sendAccessibilityEvent).toHaveBeenCalledTimes(1)
    const [view, event] = sendAccessibilityEvent.mock.calls[0]
    expect(event).toBe("focus")
    expect((view as unknown as { props: object }).props).toMatchObject({
      accessibilityLabel: "medium",
    })
  })

  test("its controller checks a radio", async () => {
    const controller = createRadioGroupController()
    await render(<Sizes controller={controller} />)
    await act(() => controller.setValue("large"))
    expect(checkedOf("large")).toBe(true)
    expect(controller.getValue()).toBe("large")
  })
})
