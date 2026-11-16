import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef, useState } from "react"
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  type HostInstance,
} from "react-native"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  createCollapsibleController,
} from "../src/collapsible"

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

afterEach(() => sendAccessibilityEvent.mockClear())

const trigger = () => screen.getByRole("button", { name: "Order #4189" })

function Order(props: React.ComponentProps<typeof Collapsible>) {
  return (
    <Collapsible {...props}>
      <CollapsibleTrigger>
        <Text>Order #4189</Text>
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <Text>Linen shirt</Text>
      </CollapsiblePanel>
    </Collapsible>
  )
}

describe("Collapsible", () => {
  test("a press on the trigger opens and closes the panel, from a touch and with no event", async () => {
    const onOpenChange = jest.fn()
    await render(<Order onOpenChange={onOpenChange} />)
    expect(trigger()).toBeCollapsed()
    expect(screen.queryByText("Linen shirt")).toBeNull()
    await fireEvent.press(trigger())
    expect(trigger()).toBeExpanded()
    expect(screen.getByText("Linen shirt")).toBeVisible()
    const [open, details] = onOpenChange.mock.calls[0]
    expect(open).toBe(true)
    expect(details).toMatchObject({ reason: "trigger-press", source: "touch" })
    expect(details.event).toBeUndefined()
    await fireEvent.press(trigger())
    expect(trigger()).toBeCollapsed()
    expect(screen.queryByText("Linen shirt")).toBeNull()
  })

  const accessibilityAction = (actionName: string) =>
    act(() =>
      trigger().props.onAccessibilityAction({ nativeEvent: { actionName } })
    )

  test("TalkBack's expand and collapse open and close the panel as a screen reader's press, and only when that changes it", async () => {
    const onOpenChange = jest.fn()
    await render(<Order onOpenChange={onOpenChange} />)
    if (Platform.OS === "ios") {
      expect(trigger().props.accessibilityActions).toBeUndefined()
      return
    }
    expect(trigger().props.accessibilityActions).toEqual([{ name: "expand" }])
    await accessibilityAction("expand")
    expect(trigger()).toBeExpanded()
    expect(screen.getByText("Linen shirt")).toBeVisible()
    expect(onOpenChange.mock.calls[0][1]).toMatchObject({
      reason: "trigger-press",
      source: "virtual",
    })
    expect(trigger().props.accessibilityActions).toEqual([{ name: "collapse" }])
    await accessibilityAction("expand")
    expect(trigger()).toBeExpanded()
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    await accessibilityAction("collapse")
    expect(trigger()).toBeCollapsed()
    expect(screen.queryByText("Linen shirt")).toBeNull()
    expect(onOpenChange.mock.calls[1]).toMatchObject([
      false,
      { source: "virtual" },
    ])
    await accessibilityAction("collapse")
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })

  test("a disabled trigger ignores TalkBack's expand", async () => {
    const onOpenChange = jest.fn()
    await render(<Order disabled onOpenChange={onOpenChange} />)
    if (Platform.OS === "android") {
      await accessibilityAction("expand")
    }
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(trigger()).toBeCollapsed()
  })

  test("a disabled trigger stays reachable and ignores a press", async () => {
    const onOpenChange = jest.fn()
    await render(<Order disabled onOpenChange={onOpenChange} />)
    expect(trigger()).toBeDisabled()
    await fireEvent.press(trigger())
    expect(onOpenChange).not.toHaveBeenCalled()
    await act(async () => {})
    expect(screen.queryByText("Linen shirt")).toBeNull()
  })

  test("its controller's focus requests accessibility focus on the trigger", async () => {
    const controller = createCollapsibleController()
    const triggerRef = createRef<HostInstance>()
    await render(
      <Collapsible controller={controller}>
        <CollapsibleTrigger ref={triggerRef}>
          <Text>Order #4189</Text>
        </CollapsibleTrigger>
      </Collapsible>
    )
    await act(() => controller.focus())
    expect(sendAccessibilityEvent).toHaveBeenCalledTimes(1)
    expect(
      sendAccessibilityEvent.mock.lastCall?.[0] === triggerRef.current
    ).toBe(true)
  })

  test("opening settles at once, and closing without onExit settles as the panel leaves", async () => {
    const onOpenChangeComplete = jest.fn()
    await render(<Order onOpenChangeComplete={onOpenChangeComplete} />)
    expect(onOpenChangeComplete).not.toHaveBeenCalled()
    await fireEvent.press(trigger())
    expect(onOpenChangeComplete.mock.calls).toEqual([[true]])
    await fireEvent.press(trigger())
    expect(onOpenChangeComplete.mock.calls).toEqual([[true], [false]])
  })

  test("a panel open from the start settles nothing as it mounts", async () => {
    const onOpenChangeComplete = jest.fn()
    await render(
      <Order defaultOpen onOpenChangeComplete={onOpenChangeComplete} />
    )
    await act(async () => {})
    expect(onOpenChangeComplete).not.toHaveBeenCalled()
  })

  test("closing with onExit keeps the panel on screen, hidden and inert, and settles on done", async () => {
    const onOpenChangeComplete = jest.fn()
    let done = () => {}
    await render(
      <Collapsible defaultOpen onOpenChangeComplete={onOpenChangeComplete}>
        <CollapsibleTrigger>
          <Text>Order #4189</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel
          testID="panel"
          onExit={(finish) => (done = finish)}
          style={(state) => ({ opacity: state.endingStyle ? 0 : 1 })}
        >
          <Text>Linen shirt</Text>
        </CollapsiblePanel>
      </Collapsible>
    )
    await fireEvent.press(trigger())
    const leaving = screen.getByTestId("panel", { includeHiddenElements: true })
    expect(leaving).toHaveStyle({ opacity: 0 })
    expect(leaving).not.toHaveStyle({ display: "none" })
    expect(leaving.props.pointerEvents).toBe("none")
    expect(screen.queryByText("Linen shirt")).toBeNull()
    expect(onOpenChangeComplete).not.toHaveBeenCalled()
    await act(() => done())
    expect(onOpenChangeComplete.mock.calls).toEqual([[false]])
    expect(
      screen.queryByTestId("panel", { includeHiddenElements: true })
    ).toBeNull()
  })

  test("reopening before done cancels the exit and settles open, never closed", async () => {
    const onOpenChangeComplete = jest.fn()
    let done = () => {}
    await render(
      <Collapsible defaultOpen onOpenChangeComplete={onOpenChangeComplete}>
        <CollapsibleTrigger>
          <Text>Order #4189</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel onExit={(finish) => (done = finish)}>
          <Text>Linen shirt</Text>
        </CollapsiblePanel>
      </Collapsible>
    )
    await fireEvent.press(trigger())
    await fireEvent.press(trigger())
    await act(() => done())
    expect(onOpenChangeComplete.mock.calls).toEqual([[true]])
    expect(screen.getByText("Linen shirt")).toBeVisible()
  })

  test("a kept panel is hidden while closed, and runs onExit before it settles", async () => {
    const onOpenChangeComplete = jest.fn()
    const onExit = jest.fn()
    await render(
      <Collapsible onOpenChangeComplete={onOpenChangeComplete}>
        <CollapsibleTrigger>
          <Text>Order #4189</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel keepMounted testID="panel" onExit={onExit}>
          <Text>Linen shirt</Text>
        </CollapsiblePanel>
      </Collapsible>
    )
    const panel = () =>
      screen.getByTestId("panel", { includeHiddenElements: true })
    expect(panel()).toHaveStyle({ display: "none" })
    await fireEvent.press(trigger())
    expect(screen.getByText("Linen shirt")).toBeVisible()
    await fireEvent.press(trigger())
    expect(onExit).toHaveBeenCalledTimes(1)
    await act(() => onExit.mock.lastCall[0]())
    expect(onOpenChangeComplete.mock.calls).toEqual([[true], [false]])
    expect(panel()).toHaveStyle({ display: "none" })
  })

  test("hiddenUntilFound keeps the closed panel mounted and still runs onExit", async () => {
    const onExit = jest.fn()
    await render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>
          <Text>Order #4189</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel hiddenUntilFound testID="panel" onExit={onExit}>
          <Text>Linen shirt</Text>
        </CollapsiblePanel>
      </Collapsible>
    )
    await fireEvent.press(trigger())
    expect(onExit).toHaveBeenCalledTimes(1)
    await act(() => onExit.mock.lastCall[0]())
    expect(
      screen.getByTestId("panel", { includeHiddenElements: true })
    ).toHaveStyle({ display: "none" })
  })

  test("a panel rendered only once open settles open as it mounts", async () => {
    const onOpenChangeComplete = jest.fn()
    function Conditional() {
      const [open, setOpen] = useState(false)
      return (
        <Collapsible
          onOpenChange={setOpen}
          onOpenChangeComplete={onOpenChangeComplete}
        >
          <CollapsibleTrigger>
            <Text>Order #4189</Text>
          </CollapsibleTrigger>
          {open && (
            <CollapsiblePanel>
              <Text>Linen shirt</Text>
            </CollapsiblePanel>
          )}
        </Collapsible>
      )
    }
    await render(<Conditional />)
    await fireEvent.press(trigger())
    expect(onOpenChangeComplete.mock.calls).toEqual([[true]])
  })

  test("the panel's flex layout reaches its children", async () => {
    await render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>
          <Text>Order #4189</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel
          style={(state) => ({
            flexDirection: "row",
            gap: 8,
            height: state.panelHeight,
          })}
        >
          <Text>Linen shirt</Text>
          <Text>Canvas tote</Text>
        </CollapsiblePanel>
      </Collapsible>
    )
    const content = screen.getByText("Linen shirt").parent
    expect(StyleSheet.flatten(content?.props.style)).toEqual({
      flexDirection: "row",
      gap: 8,
    })
  })

  describe("the panel's size", () => {
    const layout = (width: number, height: number) => ({
      nativeEvent: { layout: { x: 0, y: 0, width, height } },
    })
    const size = () =>
      StyleSheet.flatten(
        screen.getByTestId("panel", { includeHiddenElements: true }).props.style
      )

    function Measured({
      onExit,
      keepMounted,
      ...props
    }: React.ComponentProps<typeof Collapsible> & {
      onExit?: (done: () => void) => void
      keepMounted?: boolean
    }) {
      return (
        <Collapsible {...props}>
          <CollapsibleTrigger>
            <Text>Order #4189</Text>
          </CollapsibleTrigger>
          <CollapsiblePanel
            testID="panel"
            keepMounted={keepMounted}
            onExit={onExit}
            style={(state) => ({
              height: state.panelHeight,
              width: state.panelWidth,
              overflow: "hidden",
            })}
          >
            <Text>Linen shirt</Text>
          </CollapsiblePanel>
        </Collapsible>
      )
    }

    test("is its content's, measured apart from the panel's own constrained height", async () => {
      await render(<Measured defaultOpen />)
      expect(size()).toMatchObject({ height: undefined, width: undefined })
      await fireEvent(screen.getByTestId("panel"), "layout", layout(300, 0))
      await fireEvent(
        screen.getByText("Linen shirt"),
        "layout",
        layout(300, 120)
      )
      expect(size()).toMatchObject({ height: 120, width: 300 })
      await fireEvent(
        screen.getByText("Linen shirt"),
        "layout",
        layout(300, 160)
      )
      expect(size()).toMatchObject({ height: 160, width: 300 })
    })

    test("at close after an interrupted opening, is the size the panel had when it began closing", async () => {
      let done = () => {}
      await render(<Measured onExit={(finish) => (done = finish)} />)
      await fireEvent.press(trigger())
      await fireEvent(
        screen.getByText("Linen shirt"),
        "layout",
        layout(300, 120)
      )
      expect(size()).toMatchObject({ height: 120 })
      await fireEvent(screen.getByTestId("panel"), "layout", layout(300, 40))
      await fireEvent.press(trigger())
      expect(size()).toMatchObject({ height: 40, width: 300 })
      await fireEvent(
        screen.getByTestId("panel", { includeHiddenElements: true }),
        "layout",
        layout(300, 20)
      )
      expect(size()).toMatchObject({ height: 40 })
      await act(() => done())
    })

    test("is zero once a kept panel has closed", async () => {
      await render(<Measured keepMounted defaultOpen />)
      await fireEvent(
        screen.getByText("Linen shirt"),
        "layout",
        layout(300, 120)
      )
      await fireEvent.press(trigger())
      expect(size()).toMatchObject({ height: 0, width: 0 })
      await fireEvent.press(trigger())
      expect(size()).toMatchObject({ height: 120, width: 300 })
    })
  })
})
