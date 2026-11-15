import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createSwitchController, switchPrimitive } from "@ui-sdk/core/switch"
import { createRef } from "react"
import {
  AccessibilityInfo,
  Pressable,
  View,
  type HostInstance,
} from "react-native"
import { createParts } from "../src/primitive"
import { Switch, SwitchThumb } from "../src/switch"

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

afterEach(() => sendAccessibilityEvent.mockClear())

describe("Switch", () => {
  test("parts built over switchPrimitive toggle on a press, from a touch and with no event", async () => {
    const parts = createParts(switchPrimitive, {
      root: Pressable,
      thumb: View,
    })
    const onCheckedChange = jest.fn()
    await render(
      <parts.Root onCheckedChange={onCheckedChange} testID="switch">
        <parts.Thumb />
      </parts.Root>
    )
    const control = screen.getByRole("switch")
    expect(control).not.toBeChecked()
    await fireEvent.press(control)
    expect(control).toBeChecked()
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    const [checked, details] = onCheckedChange.mock.calls[0]
    expect(checked).toBe(true)
    expect(details).toMatchObject({ reason: "press", source: "touch" })
    expect(details.event).toBeUndefined()
  })

  test("the entry's Switch toggles on a press and renders its thumb inside", async () => {
    await render(
      <Switch testID="switch">
        <SwitchThumb testID="thumb" />
      </Switch>
    )
    expect(screen.getByTestId("thumb")).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole("switch"))
    expect(screen.getByRole("switch")).toBeChecked()
  })

  // Android disables the view for `accessibilityState.disabled`, and its focus
  // search skips a disabled view, so Tab passes over it.
  test("a disabled switch passes the disabled state that takes it out of Android's Tab order", async () => {
    const { rerender } = await render(<Switch disabled testID="switch" />)
    expect(screen.getByTestId("switch").props.accessibilityState).toEqual({
      checked: false,
      disabled: true,
    })
    await rerender(<Switch testID="switch" />)
    expect(screen.getByTestId("switch").props.accessibilityState).toEqual({
      checked: false,
    })
  })

  test("a disabled switch ignores a press", async () => {
    const onCheckedChange = jest.fn()
    await render(<Switch disabled onCheckedChange={onCheckedChange} />)
    await fireEvent.press(screen.getByRole("switch"))
    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(screen.getByRole("switch")).not.toBeChecked()
    expect(screen.getByRole("switch")).toBeDisabled()
  })

  test("a controlled switch shows what its parent passes", async () => {
    const { rerender } = await render(<Switch checked={false} />)
    await fireEvent.press(screen.getByRole("switch"))
    expect(screen.getByRole("switch")).not.toBeChecked()
    await rerender(<Switch checked />)
    expect(screen.getByRole("switch")).toBeChecked()
  })

  test("the controller's focus requests accessibility focus on the switch's view", async () => {
    const controller = createSwitchController()
    const ref = createRef<HostInstance>()
    await render(<Switch controller={controller} ref={ref} />)
    await act(() => controller.focus())
    expect(ref.current).not.toBeNull()
    expect(sendAccessibilityEvent).toHaveBeenCalledTimes(1)
    expect(sendAccessibilityEvent).toHaveBeenCalledWith(ref.current, "focus")
  })

  test("the controller's focus makes no request once the switch has unmounted", async () => {
    const controller = createSwitchController()
    const { rerender } = await render(<Switch controller={controller} />)
    await rerender(<View />)
    await act(() => controller.focus())
    expect(sendAccessibilityEvent).not.toHaveBeenCalled()
  })
})
