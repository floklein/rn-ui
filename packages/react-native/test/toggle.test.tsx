import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef, type RefObject, useState } from "react"
import {
  AccessibilityInfo,
  I18nManager,
  Pressable,
  Text,
  type HostInstance,
} from "react-native"
import {
  createToggleController,
  createToggleGroupController,
  Toggle,
  ToggleGroup,
  ToggleIcon,
} from "../src/toggle"

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

afterEach(() => sendAccessibilityEvent.mockClear())

const toggleNamed = (name: string) =>
  screen.getByRole("togglebutton", { name })

// Jest's checked matchers don't take the toggle button role.
const pressedOf = (name: string) =>
  toggleNamed(name).props.accessibilityState?.checked

describe("Toggle", () => {
  test("a press presses it, from a touch and with no event", async () => {
    const onPressedChange = jest.fn()
    await render(
      <Toggle onPressedChange={onPressedChange}>
        <Text>Bookmark</Text>
      </Toggle>
    )
    expect(pressedOf("Bookmark")).toBe(false)
    await fireEvent.press(toggleNamed("Bookmark"))
    expect(pressedOf("Bookmark")).toBe(true)
    const [pressed, details] = onPressedChange.mock.calls[0]
    expect(pressed).toBe(true)
    expect(details).toMatchObject({ reason: "press", source: "touch" })
    expect(details.event).toBeUndefined()
  })

  test("a disabled toggle ignores a press", async () => {
    const onPressedChange = jest.fn()
    await render(
      <Toggle disabled onPressedChange={onPressedChange}>
        <Text>Bookmark</Text>
      </Toggle>
    )
    await fireEvent.press(toggleNamed("Bookmark"))
    expect(onPressedChange).not.toHaveBeenCalled()
    expect(toggleNamed("Bookmark")).toBeDisabled()
    expect(pressedOf("Bookmark")).toBe(false)
  })

  test("a controlled toggle shows what its parent passes", async () => {
    const { rerender } = await render(
      <Toggle pressed={false}>
        <Text>Bookmark</Text>
      </Toggle>
    )
    await fireEvent.press(toggleNamed("Bookmark"))
    expect(pressedOf("Bookmark")).toBe(false)
    await rerender(
      <Toggle pressed>
        <Text>Bookmark</Text>
      </Toggle>
    )
    expect(pressedOf("Bookmark")).toBe(true)
  })

  test("its icon is hidden from screen readers, and style functions get the state", async () => {
    await render(
      <Toggle aria-label="Star" testID="toggle">
        <ToggleIcon
          testID="icon"
          style={(state) => ({ opacity: state.mirror ? 0.5 : 1 })}
        />
      </Toggle>
    )
    const icon = screen.getByTestId("icon", { includeHiddenElements: true })
    expect(icon).not.toBeVisible()
    expect(icon).toHaveStyle({ opacity: 1 })
  })

  test("a mirrored icon flips when the app runs right to left", async () => {
    const isRTL = jest.replaceProperty(I18nManager, "isRTL", true)
    await render(
      <Toggle aria-label="Back">
        <ToggleIcon mirror testID="icon" />
      </Toggle>
    )
    expect(
      screen.getByTestId("icon", { includeHiddenElements: true })
    ).toHaveStyle({ transform: [{ scaleX: -1 }] })
    isRTL.restore()
  })

  test("its controller's focus requests accessibility focus on its view", async () => {
    const controller = createToggleController()
    const ref = createRef<HostInstance>()
    await render(
      <Toggle controller={controller} ref={ref}>
        <Text>Bookmark</Text>
      </Toggle>
    )
    await act(() => controller.focus())
    expect(sendAccessibilityEvent).toHaveBeenCalledTimes(1)
    expect(sendAccessibilityEvent).toHaveBeenCalledWith(ref.current, "focus")
  })
})

function Formatting({
  onValueChange,
  italic = true,
  disabled,
  controller,
  refs = {},
}: {
  onValueChange?: (value: string[]) => void
  italic?: boolean
  disabled?: string
  controller?: ReturnType<typeof createToggleGroupController>
  refs?: Record<string, RefObject<HostInstance | null>>
}) {
  return (
    <ToggleGroup
      multiple
      aria-label="Text formatting"
      controller={controller}
      onValueChange={onValueChange}
    >
      {["bold", "italic", "underline"]
        .filter((value) => italic || value !== "italic")
        .map((value) => (
          <Toggle
            key={value}
            value={value}
            aria-label={value}
            disabled={value === disabled}
            ref={refs[value]}
          />
        ))}
    </ToggleGroup>
  )
}

describe("ToggleGroup", () => {
  test("pressing a toggle in a single group unpresses the one pressed before", async () => {
    const onValueChange = jest.fn()
    await render(
      <ToggleGroup defaultValue={["list"]} onValueChange={onValueChange}>
        <Toggle value="list">
          <Text>List</Text>
        </Toggle>
        <Toggle value="grid">
          <Text>Grid</Text>
        </Toggle>
      </ToggleGroup>
    )
    expect(pressedOf("List")).toBe(true)
    await fireEvent.press(toggleNamed("Grid"))
    expect(pressedOf("Grid")).toBe(true)
    expect(pressedOf("List")).toBe(false)
    const [value, details] = onValueChange.mock.calls[0]
    expect(value).toEqual(["grid"])
    expect(details).toMatchObject({ reason: "item-press", source: "touch" })
  })

  test("deselectable={false} keeps the pressed toggle pressed", async () => {
    await render(
      <ToggleGroup defaultValue={["start"]} deselectable={false}>
        <Toggle value="start" aria-label="Align start" />
        <Toggle value="end" aria-label="Align end" />
      </ToggleGroup>
    )
    await fireEvent.press(toggleNamed("Align start"))
    expect(pressedOf("Align start")).toBe(true)
  })

  test("a multiple group's value lists toggles in the order they render, not the order they were pressed", async () => {
    const onValueChange = jest.fn()
    await render(<Formatting onValueChange={onValueChange} />)
    await fireEvent.press(toggleNamed("underline"))
    await fireEvent.press(toggleNamed("bold"))
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["bold", "underline"],
      expect.anything()
    )
  })

  test("a toggle that renders later between two others takes its place in the value", async () => {
    const onValueChange = jest.fn()
    const { rerender } = await render(
      <Formatting italic={false} onValueChange={onValueChange} />
    )
    await fireEvent.press(toggleNamed("underline"))
    await rerender(<Formatting onValueChange={onValueChange} />)
    await fireEvent.press(toggleNamed("italic"))
    await fireEvent.press(toggleNamed("bold"))
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["bold", "italic", "underline"],
      expect.anything()
    )
  })

  test("toggles follow the group's controlled value", async () => {
    function Controlled() {
      const [value, setValue] = useState<string[]>([])
      return (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => setValue(["grid"])}
          >
            <Text>Show grid</Text>
          </Pressable>
          <ToggleGroup value={value} onValueChange={setValue}>
            <Toggle value="list" aria-label="List" />
            <Toggle value="grid" aria-label="Grid" />
          </ToggleGroup>
        </>
      )
    }
    await render(<Controlled />)
    await fireEvent.press(screen.getByRole("button", { name: "Show grid" }))
    expect(pressedOf("Grid")).toBe(true)
    await fireEvent.press(toggleNamed("List"))
    expect(pressedOf("List")).toBe(true)
    expect(pressedOf("Grid")).toBe(false)
  })

  test("a disabled toggle in a group ignores a press and the controller's toggle", async () => {
    const controller = createToggleGroupController()
    const onValueChange = jest.fn()
    await render(
      <Formatting
        controller={controller}
        disabled="bold"
        onValueChange={onValueChange}
      />
    )
    expect(toggleNamed("bold")).toBeDisabled()
    await fireEvent.press(toggleNamed("bold"))
    expect(await act(() => controller.toggle("bold"))).toBe(false)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test("a disabled group disables every toggle in it", async () => {
    await render(
      <ToggleGroup disabled>
        <Toggle value="list" aria-label="List" />
      </ToggleGroup>
    )
    await fireEvent.press(toggleNamed("List"))
    expect(toggleNamed("List")).toBeDisabled()
    expect(pressedOf("List")).toBe(false)
  })

  test("the controller's focus requests accessibility focus on a toggle by its value, or the first", async () => {
    const controller = createToggleGroupController()
    const refs = { bold: createRef<HostInstance>(), italic: createRef<HostInstance>() }
    await render(<Formatting controller={controller} refs={refs} />)
    await act(() => controller.focus("italic"))
    expect(sendAccessibilityEvent.mock.lastCall?.[0]).toBe(refs.italic.current)
    await act(() => controller.focus())
    expect(sendAccessibilityEvent.mock.lastCall?.[0]).toBe(refs.bold.current)
    expect(sendAccessibilityEvent).toHaveBeenCalledTimes(2)
  })

  test("a toggle that unmounts leaves the group, so focusing it asks nothing", async () => {
    const controller = createToggleGroupController()
    const { rerender } = await render(<Formatting controller={controller} />)
    await rerender(<Formatting controller={controller} italic={false} />)
    await act(() => controller.focus("italic"))
    expect(sendAccessibilityEvent).not.toHaveBeenCalled()
  })

  test("the group's style functions get its state", async () => {
    await render(
      <ToggleGroup
        multiple
        defaultValue={["bold"]}
        testID="group"
        style={(state) => ({ opacity: state.value.length })}
      >
        <Toggle value="bold" aria-label="Bold" />
      </ToggleGroup>
    )
    expect(screen.getByTestId("group")).toHaveStyle({ opacity: 1 })
  })
})
