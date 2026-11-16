import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { AccessibilityInfo, I18nManager, StyleSheet, Text } from "react-native"
import {
  createSegmentedControlController,
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "../src/segmented-control"

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

afterEach(() => sendAccessibilityEvent.mockClear())

const item = (name: string) => screen.getByRole("radio", { name })
const checkedOf = (name: string) => item(name).props.accessibilityState?.checked
const indicator = () =>
  screen.getByTestId("indicator", { includeHiddenElements: true })
const layout = (x: number, y: number, width: number, height: number) => ({
  nativeEvent: { layout: { x, y, width, height } },
})

function View({
  disabledValue,
  ...props
}: React.ComponentProps<typeof SegmentedControl> & { disabledValue?: string }) {
  return (
    <SegmentedControl aria-label="View" testID="control" {...props}>
      <SegmentedControlIndicator
        testID="indicator"
        style={(state) => ({
          left: state.indicatorLeft,
          right: state.indicatorRight,
          top: state.indicatorTop,
          bottom: state.indicatorBottom,
          width: state.indicatorWidth,
          height: state.indicatorHeight,
        })}
      />
      {["list", "grid", "board"].map((value) => (
        <SegmentedControlItem
          key={value}
          value={value}
          disabled={value === disabledValue}
          testID={value}
        >
          <Text>{value}</Text>
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  )
}

describe("SegmentedControl", () => {
  test("a press checks an item and unchecks the others, from a touch and with no event", async () => {
    const onValueChange = jest.fn()
    await render(<View defaultValue="list" onValueChange={onValueChange} />)
    expect(screen.getByTestId("control")).toHaveProp(
      "accessibilityRole",
      "radiogroup"
    )
    expect(screen.getAllByRole("radio")).toHaveLength(3)
    expect(checkedOf("list")).toBe(true)
    await fireEvent.press(item("board"))
    expect(checkedOf("board")).toBe(true)
    expect(checkedOf("list")).toBe(false)
    const [value, details] = onValueChange.mock.calls[0]
    expect(value).toBe("board")
    expect(details).toMatchObject({ reason: "item-press", source: "touch" })
    expect(details.event).toBeUndefined()
  })

  test("every item stays in the keyboard order, not only the checked one", async () => {
    await render(<View defaultValue="grid" />)
    for (const name of ["list", "grid", "board"]) {
      expect(item(name).props.focusable).not.toBe(false)
      expect(item(name).props).not.toHaveProperty("tabIndex")
    }
  })

  test("a disabled item ignores a press, and a disabled control disables every item", async () => {
    const onValueChange = jest.fn()
    const { rerender } = await render(
      <View disabledValue="board" onValueChange={onValueChange} />
    )
    expect(item("board")).toBeDisabled()
    expect(item("list")).not.toBeDisabled()
    await fireEvent.press(item("board"))
    expect(onValueChange).not.toHaveBeenCalled()
    await rerender(<View disabled onValueChange={onValueChange} />)
    for (const name of ["list", "grid", "board"]) {
      expect(item(name)).toBeDisabled()
    }
    await fireEvent.press(item("list"))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test("a read-only control keeps its items enabled but changes nothing", async () => {
    const onValueChange = jest.fn()
    await render(
      <View readOnly defaultValue="list" onValueChange={onValueChange} />
    )
    expect(item("grid")).not.toBeDisabled()
    await fireEvent.press(item("grid"))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(checkedOf("list")).toBe(true)
  })

  test("a controlled control shows what its parent passes", async () => {
    const { rerender } = await render(<View value="grid" />)
    await fireEvent.press(item("board"))
    expect(checkedOf("grid")).toBe(true)
    await rerender(<View value="board" />)
    expect(checkedOf("board")).toBe(true)
  })

  test("its controller checks an item, and its focus requests accessibility focus on the checked one", async () => {
    const controller = createSegmentedControlController()
    await render(<View defaultValue="grid" controller={controller} />)
    await act(async () => {})
    await act(() => controller.setValue("board"))
    expect(checkedOf("board")).toBe(true)
    await act(() => controller.focus())
    expect(sendAccessibilityEvent).toHaveBeenCalledTimes(1)
    const [view, event] = sendAccessibilityEvent.mock.calls[0]
    expect(event).toBe("focus")
    expect((view as unknown as { props: object }).props).toMatchObject({
      testID: "board",
    })
  })

  test("the indicator's state holds the checked item's box in the control, measured from their layouts", async () => {
    await render(<View defaultValue="list" />)
    expect(StyleSheet.flatten(indicator().props.style)).toEqual({})
    await fireEvent(
      screen.getByTestId("control"),
      "layout",
      layout(0, 0, 300, 48)
    )
    await fireEvent(item("list"), "layout", layout(4, 4, 100, 40))
    await fireEvent(item("grid"), "layout", layout(104, 4, 90, 40))
    expect(indicator()).toHaveStyle({
      left: 4,
      right: 196,
      top: 4,
      bottom: 4,
      width: 100,
      height: 40,
    })
    await fireEvent.press(item("grid"))
    expect(indicator()).toHaveStyle({ left: 104, right: 106, width: 90 })
    await fireEvent(item("grid"), "layout", layout(110, 4, 80, 40))
    expect(indicator()).toHaveStyle({ left: 110, right: 110, width: 80 })
  })

  test("the indicator's box is measured inside the control's border, where absolute positions start", async () => {
    await render(
      <View
        defaultValue="list"
        style={() => ({ borderWidth: 2, borderLeftWidth: 3 })}
      />
    )
    await fireEvent(
      screen.getByTestId("control"),
      "layout",
      layout(0, 0, 300, 48)
    )
    await fireEvent(item("list"), "layout", layout(7, 6, 100, 36))
    expect(indicator()).toHaveStyle({
      left: 4,
      right: 191,
      top: 4,
      bottom: 4,
      width: 100,
      height: 36,
    })
  })

  test("with nothing checked, the indicator's box is unset", async () => {
    const { rerender } = await render(<View value="list" />)
    await fireEvent(
      screen.getByTestId("control"),
      "layout",
      layout(0, 0, 300, 48)
    )
    await fireEvent(item("list"), "layout", layout(4, 4, 100, 40))
    expect(indicator()).toHaveStyle({ width: 100 })
    await rerender(<View value={null} />)
    expect(StyleSheet.flatten(indicator().props.style)).toEqual({})
  })

  test("right to left, the indicator's left and right follow React Native's swapped left and right styles", async () => {
    const isRTL = jest.replaceProperty(I18nManager, "isRTL", true)
    const { rerender } = await render(<View defaultValue="list" />)
    await fireEvent(
      screen.getByTestId("control"),
      "layout",
      layout(0, 0, 300, 48)
    )
    await fireEvent(item("list"), "layout", layout(196, 4, 100, 40))
    expect(indicator()).toHaveStyle({ left: 4, right: 196 })
    await rerender(
      <View
        defaultValue="list"
        style={{ borderStartWidth: 1, borderEndWidth: 3 }}
      />
    )
    await fireEvent(item("list"), "layout", layout(195, 4, 100, 40))
    expect(indicator()).toHaveStyle({ left: 4, right: 192 })
    isRTL.restore()
  })

  test("the indicator's state carries the orientation", async () => {
    await render(
      <SegmentedControl aria-label="Align" orientation="vertical">
        <SegmentedControlIndicator
          testID="indicator"
          style={(state) => ({
            flexDirection: state.orientation === "vertical" ? "column" : "row",
          })}
        />
        <SegmentedControlItem value="top">
          <Text>Top</Text>
        </SegmentedControlItem>
      </SegmentedControl>
    )
    expect(indicator()).toHaveStyle({ flexDirection: "column" })
  })
})
