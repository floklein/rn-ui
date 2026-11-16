import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import {
  AccessibilityInfo,
  I18nManager,
  StyleSheet,
  Text,
  type HostInstance,
} from "react-native"
import {
  createTabsController,
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "../src/tabs"

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

afterEach(() => sendAccessibilityEvent.mockClear())

const tabNamed = (name: string) => screen.getByRole("tab", { name })

function Account({
  disabled,
  billingRef,
  ...props
}: React.ComponentProps<typeof Tabs> & {
  disabled?: boolean
  billingRef?: React.Ref<HostInstance>
}) {
  return (
    <Tabs {...props}>
      <TabsList aria-label="Account">
        <TabsTab value="profile" disabled={disabled}>
          <Text>Profile</Text>
        </TabsTab>
        <TabsTab value="billing" ref={billingRef}>
          <Text>Billing</Text>
        </TabsTab>
      </TabsList>
      <TabsPanel value="profile">
        <Text>Profile panel</Text>
      </TabsPanel>
      <TabsPanel value="billing">
        <Text>Billing panel</Text>
      </TabsPanel>
    </Tabs>
  )
}

describe("Tabs", () => {
  test("a press selects a tab and shows its panel, from a touch and with no event", async () => {
    const onValueChange = jest.fn()
    await render(
      <Account defaultValue="profile" onValueChange={onValueChange} />
    )
    expect(tabNamed("Profile")).toBeSelected()
    expect(screen.getByText("Profile panel")).toBeVisible()
    expect(screen.queryByText("Billing panel")).toBeNull()
    await fireEvent.press(tabNamed("Billing"))
    expect(tabNamed("Billing")).toBeSelected()
    expect(tabNamed("Profile")).not.toBeSelected()
    expect(screen.getByText("Billing panel")).toBeVisible()
    expect(screen.queryByText("Profile panel")).toBeNull()
    const [value, details] = onValueChange.mock.calls[0]
    expect(value).toBe("billing")
    expect(details).toMatchObject({ reason: "item-press", source: "touch" })
    expect(details.event).toBeUndefined()
  })

  test("with nothing selected, the first enabled tab selects once the tabs mount, calling nothing", async () => {
    const onValueChange = jest.fn()
    await render(<Account disabled onValueChange={onValueChange} />)
    await act(async () => {})
    expect(tabNamed("Billing")).toBeSelected()
    expect(screen.getByText("Billing panel")).toBeVisible()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test("a disabled tab stays reachable and ignores a press", async () => {
    const onValueChange = jest.fn()
    await render(
      <Account disabled defaultValue="billing" onValueChange={onValueChange} />
    )
    expect(tabNamed("Profile")).toBeDisabled()
    await fireEvent.press(tabNamed("Profile"))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(tabNamed("Billing")).toBeSelected()
  })

  test("its controller's focus requests accessibility focus on the selected tab", async () => {
    const controller = createTabsController()
    const billingRef = createRef<HostInstance>()
    await render(
      <Account
        controller={controller}
        defaultValue="billing"
        billingRef={billingRef}
      />
    )
    await act(async () => {})
    await act(() => controller.focus())
    expect(sendAccessibilityEvent).toHaveBeenCalledTimes(1)
    expect(
      sendAccessibilityEvent.mock.lastCall?.[0] === billingRef.current
    ).toBe(true)
  })

  test("a panel with onExit stays on screen while it animates out, hidden from screen readers, until done", async () => {
    let done = () => {}
    await render(
      <Tabs defaultValue="profile">
        <TabsList aria-label="Account">
          <TabsTab value="profile">
            <Text>Profile</Text>
          </TabsTab>
          <TabsTab value="billing">
            <Text>Billing</Text>
          </TabsTab>
        </TabsList>
        <TabsPanel
          value="profile"
          testID="profile"
          onExit={(finish) => (done = finish)}
          style={(state) => ({ opacity: state.endingStyle ? 0 : 1 })}
        >
          <Text>Profile panel</Text>
        </TabsPanel>
        <TabsPanel value="billing">
          <Text>Billing panel</Text>
        </TabsPanel>
      </Tabs>
    )
    await fireEvent.press(tabNamed("Billing"))
    const leaving = screen.getByTestId("profile", {
      includeHiddenElements: true,
    })
    expect(leaving).toHaveStyle({ opacity: 0 })
    expect(leaving).not.toHaveStyle({ display: "none" })
    expect(screen.queryByText("Profile panel")).toBeNull()
    await act(() => done())
    expect(
      screen.queryByTestId("profile", { includeHiddenElements: true })
    ).toBeNull()
  })

  test("a kept panel is hidden while its tab isn't selected", async () => {
    await render(
      <Tabs defaultValue="billing">
        <TabsList aria-label="Account">
          <TabsTab value="profile">
            <Text>Profile</Text>
          </TabsTab>
          <TabsTab value="billing">
            <Text>Billing</Text>
          </TabsTab>
        </TabsList>
        <TabsPanel value="profile" keepMounted testID="profile">
          <Text>Profile panel</Text>
        </TabsPanel>
      </Tabs>
    )
    expect(
      screen.getByTestId("profile", { includeHiddenElements: true })
    ).toHaveStyle({ display: "none" })
    await fireEvent.press(tabNamed("Profile"))
    expect(screen.getByText("Profile panel")).toBeVisible()
  })

  test("the indicator's state holds the selected tab's box in the list, measured from their layouts", async () => {
    const layout = (x: number, width: number, height = 40) => ({
      nativeEvent: { layout: { x, y: 0, width, height } },
    })
    await render(
      <Tabs defaultValue="profile">
        <TabsList aria-label="Account" testID="list">
          <TabsTab value="profile">
            <Text>Profile</Text>
          </TabsTab>
          <TabsTab value="billing">
            <Text>Billing</Text>
          </TabsTab>
          <TabsIndicator
            testID="indicator"
            style={(state) => ({
              left: state.activeTabLeft,
              right: state.activeTabRight,
              top: state.activeTabTop,
              bottom: state.activeTabBottom,
              width: state.activeTabWidth,
              height: state.activeTabHeight,
            })}
          />
        </TabsList>
      </Tabs>
    )
    const indicator = () =>
      screen.getByTestId("indicator", { includeHiddenElements: true })
    expect(StyleSheet.flatten(indicator().props.style)).toEqual({})
    await fireEvent(screen.getByTestId("list"), "layout", layout(0, 300, 48))
    await fireEvent(tabNamed("Profile"), "layout", layout(4, 100))
    await fireEvent(tabNamed("Billing"), "layout", layout(104, 120))
    expect(indicator()).toHaveStyle({
      left: 4,
      right: 196,
      top: 0,
      bottom: 8,
      width: 100,
      height: 40,
    })
    await fireEvent.press(tabNamed("Billing"))
    expect(indicator()).toHaveStyle({ left: 104, right: 76, width: 120 })
    await fireEvent(tabNamed("Billing"), "layout", layout(110, 130))
    expect(indicator()).toHaveStyle({ left: 110, right: 60, width: 130 })
  })

  test("right to left, the indicator's left and right follow React Native's swapped left and right styles", async () => {
    const isRTL = jest.replaceProperty(I18nManager, "isRTL", true)
    const layout = (x: number, width: number) => ({
      nativeEvent: { layout: { x, y: 0, width, height: 40 } },
    })
    const box = () =>
      StyleSheet.flatten(
        screen.getByTestId("indicator", { includeHiddenElements: true }).props
          .style
      )
    await render(
      <Tabs defaultValue="profile">
        <TabsList aria-label="Account" testID="list">
          <TabsTab value="profile">
            <Text>Profile</Text>
          </TabsTab>
          <TabsIndicator
            testID="indicator"
            style={(state) => ({
              left: state.activeTabLeft,
              right: state.activeTabRight,
            })}
          />
        </TabsList>
      </Tabs>
    )
    await fireEvent(screen.getByTestId("list"), "layout", layout(0, 300))
    await fireEvent(tabNamed("Profile"), "layout", layout(196, 100))
    expect(box()).toEqual({ left: 4, right: 196 })
    const swaps = jest.replaceProperty(
      I18nManager,
      "doLeftAndRightSwapInRTL",
      false
    )
    await fireEvent(tabNamed("Profile"), "layout", layout(194, 100))
    expect(box()).toEqual({ left: 194, right: 6 })
    swaps.restore()
    isRTL.restore()
  })

  test("a tab whose value changes keeps its box under the new value", async () => {
    function Renamed({ value }: { value: string }) {
      return (
        <Tabs value={value}>
          <TabsList aria-label="Account" testID="list">
            <TabsTab value={value}>
              <Text>Profile</Text>
            </TabsTab>
            <TabsIndicator
              testID="indicator"
              style={(state) => ({ width: state.activeTabWidth })}
            />
          </TabsList>
        </Tabs>
      )
    }
    const { rerender } = await render(<Renamed value="profile" />)
    await fireEvent(screen.getByTestId("list"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 40 } },
    })
    await fireEvent(tabNamed("Profile"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 100, height: 40 } },
    })
    await rerender(<Renamed value="account" />)
    expect(
      screen.getByTestId("indicator", { includeHiddenElements: true })
    ).toHaveStyle({ width: 100 })
  })
})
