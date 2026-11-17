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
  createAccordionController,
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "../src/accordion"

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

afterEach(() => sendAccessibilityEvent.mockClear())

const trigger = (name: string) => screen.getByRole("button", { name })

function Faq(props: React.ComponentProps<typeof Accordion>) {
  return (
    <Accordion {...props}>
      <AccordionItem value="shipping">
        <AccordionHeader>
          <AccordionTrigger>
            <Text>Shipping</Text>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>
          <Text>Ships in two days.</Text>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionHeader>
          <AccordionTrigger>
            <Text>Returns</Text>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>
          <Text>Return within 30 days.</Text>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

describe("Accordion", () => {
  test("a press opens its item and closes the open one, from a touch", async () => {
    const onValueChange = jest.fn()
    await render(<Faq onValueChange={onValueChange} />)
    expect(trigger("Shipping")).toBeCollapsed()
    expect(screen.queryByText("Ships in two days.")).toBeNull()
    await fireEvent.press(trigger("Shipping"))
    expect(trigger("Shipping")).toBeExpanded()
    expect(screen.getByText("Ships in two days.")).toBeVisible()
    expect(onValueChange.mock.lastCall).toMatchObject([
      ["shipping"],
      { reason: "trigger-press", source: "touch" },
    ])
    await fireEvent.press(trigger("Returns"))
    expect(trigger("Shipping")).toBeCollapsed()
    expect(screen.queryByText("Ships in two days.")).toBeNull()
    expect(screen.getByText("Return within 30 days.")).toBeVisible()
  })

  test("opening settles the item at once, and closing without onExit as its panel leaves", async () => {
    const onOpenChangeComplete = jest.fn()
    await render(
      <Accordion>
        <AccordionItem
          value="shipping"
          onOpenChangeComplete={onOpenChangeComplete}
        >
          <AccordionTrigger>
            <Text>Shipping</Text>
          </AccordionTrigger>
          <AccordionPanel>
            <Text>Ships in two days.</Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    )
    await fireEvent.press(trigger("Shipping"))
    expect(onOpenChangeComplete.mock.calls).toEqual([[true]])
    await fireEvent.press(trigger("Shipping"))
    expect(onOpenChangeComplete.mock.calls).toEqual([[true], [false]])
  })

  test("an item open from the start settles nothing as it mounts", async () => {
    const onOpenChangeComplete = jest.fn()
    await render(
      <Accordion defaultValue={["shipping"]}>
        <AccordionItem
          value="shipping"
          onOpenChangeComplete={onOpenChangeComplete}
        >
          <AccordionTrigger>
            <Text>Shipping</Text>
          </AccordionTrigger>
          <AccordionPanel>
            <Text>Ships in two days.</Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    )
    await act(async () => {})
    expect(onOpenChangeComplete).not.toHaveBeenCalled()
  })

  test("closing with onExit keeps the panel on screen, inert, until done, then settles", async () => {
    const onOpenChangeComplete = jest.fn()
    let done = () => {}
    await render(
      <Accordion defaultValue={["shipping"]}>
        <AccordionItem
          value="shipping"
          onOpenChangeComplete={onOpenChangeComplete}
        >
          <AccordionTrigger>
            <Text>Shipping</Text>
          </AccordionTrigger>
          <AccordionPanel
            testID="panel"
            onExit={(finish) => (done = finish)}
            style={(state) => ({ opacity: state.endingStyle ? 0 : 1 })}
          >
            <Text>Ships in two days.</Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    )
    await fireEvent.press(trigger("Shipping"))
    const leaving = screen.getByTestId("panel", { includeHiddenElements: true })
    expect(leaving).toHaveStyle({ opacity: 0 })
    expect(leaving.props.pointerEvents).toBe("none")
    expect(onOpenChangeComplete).not.toHaveBeenCalled()
    await act(() => done())
    expect(onOpenChangeComplete.mock.calls).toEqual([[false]])
    expect(
      screen.queryByTestId("panel", { includeHiddenElements: true })
    ).toBeNull()
  })

  test("a panel rendered only once its item opens settles open as it mounts", async () => {
    const onOpenChangeComplete = jest.fn()
    function Conditional() {
      const [value, setValue] = useState<string[]>([])
      return (
        <Accordion value={value} onValueChange={setValue}>
          <AccordionItem
            value="shipping"
            onOpenChangeComplete={onOpenChangeComplete}
          >
            <AccordionTrigger>
              <Text>Shipping</Text>
            </AccordionTrigger>
            {value.includes("shipping") && (
              <AccordionPanel>
                <Text>Ships in two days.</Text>
              </AccordionPanel>
            )}
          </AccordionItem>
        </Accordion>
      )
    }
    await render(<Conditional />)
    await fireEvent.press(trigger("Shipping"))
    expect(onOpenChangeComplete.mock.calls).toEqual([[true]])
  })

  test("each item's index follows where it renders, also for an item added before the others", async () => {
    function Items({ items }: { items: string[] }) {
      return (
        <Accordion>
          {items.map((item) => (
            <AccordionItem key={item} value={item}>
              {(state) => <Text>{`${item} ${state.index}`}</Text>}
            </AccordionItem>
          ))}
        </Accordion>
      )
    }
    const view = await render(<Items items={["shipping", "returns"]} />)
    await act(async () => {})
    expect(screen.getByText("shipping 0")).toBeVisible()
    expect(screen.getByText("returns 1")).toBeVisible()
    await view.rerender(<Items items={["sizes", "shipping", "returns"]} />)
    await act(async () => {})
    expect(screen.getByText("sizes 0")).toBeVisible()
    expect(screen.getByText("shipping 1")).toBeVisible()
    expect(screen.getByText("returns 2")).toBeVisible()
  })

  test("openAll opens every enabled item", async () => {
    const controller = createAccordionController()
    await render(<Faq multiple controller={controller} />)
    await act(async () => {})
    await act(() => controller.openAll())
    expect(controller.getValue()).toEqual(["shipping", "returns"])
  })

  test("its controller's focus requests accessibility focus on an item's trigger, or the first", async () => {
    const controller = createAccordionController()
    const shipping = createRef<HostInstance>()
    const returns = createRef<HostInstance>()
    await render(
      <Accordion controller={controller}>
        <AccordionItem value="shipping">
          <AccordionTrigger ref={shipping}>
            <Text>Shipping</Text>
          </AccordionTrigger>
        </AccordionItem>
        <AccordionItem value="returns">
          <AccordionTrigger ref={returns}>
            <Text>Returns</Text>
          </AccordionTrigger>
        </AccordionItem>
      </Accordion>
    )
    await act(async () => {})
    await act(() => controller.focus("returns"))
    expect(sendAccessibilityEvent.mock.lastCall?.[0] === returns.current).toBe(
      true
    )
    await act(() => controller.focus())
    expect(sendAccessibilityEvent.mock.lastCall?.[0] === shipping.current).toBe(
      true
    )
  })

  test("the open item that can't close reads as disabled and ignores a press", async () => {
    await render(<Faq defaultValue={["shipping"]} collapsible={false} />)
    expect(trigger("Shipping")).toBeDisabled()
    expect(trigger("Returns")).not.toBeDisabled()
    await fireEvent.press(trigger("Shipping"))
    expect(trigger("Shipping")).toBeExpanded()
  })

  test("TalkBack's expand and collapse open and close an item as a screen reader's press", async () => {
    const onValueChange = jest.fn()
    await render(<Faq onValueChange={onValueChange} />)
    const action = (actionName: string) =>
      act(() =>
        trigger("Shipping").props.onAccessibilityAction({
          nativeEvent: { actionName },
        })
      )
    if (Platform.OS === "ios") {
      expect(trigger("Shipping").props.accessibilityActions).toBeUndefined()
      return
    }
    expect(trigger("Shipping").props.accessibilityActions).toEqual([
      { name: "expand" },
    ])
    await action("expand")
    expect(trigger("Shipping")).toBeExpanded()
    expect(onValueChange.mock.lastCall).toMatchObject([
      ["shipping"],
      { reason: "trigger-press", source: "virtual" },
    ])
    await action("collapse")
    expect(trigger("Shipping")).toBeCollapsed()
  })

  test("a disabled item's trigger stays reachable and ignores a press", async () => {
    const onValueChange = jest.fn()
    await render(
      <Accordion onValueChange={onValueChange}>
        <AccordionItem value="shipping" disabled>
          <AccordionTrigger>
            <Text>Shipping</Text>
          </AccordionTrigger>
          <AccordionPanel>
            <Text>Ships in two days.</Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    )
    expect(trigger("Shipping")).toBeDisabled()
    await fireEvent.press(trigger("Shipping"))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.queryByText("Ships in two days.")).toBeNull()
  })

  test("a panel's size is its content's, and the size it had while it animates out", async () => {
    const layout = (width: number, height: number) => ({
      nativeEvent: { layout: { x: 0, y: 0, width, height } },
    })
    await render(
      <Accordion defaultValue={["shipping"]}>
        <AccordionItem value="shipping">
          <AccordionTrigger>
            <Text>Shipping</Text>
          </AccordionTrigger>
          <AccordionPanel
            testID="panel"
            onExit={() => {}}
            style={(state) => ({ height: state.panelHeight })}
          >
            <Text>Ships in two days.</Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    )
    const height = () =>
      StyleSheet.flatten(
        screen.getByTestId("panel", { includeHiddenElements: true }).props.style
      ).height
    await fireEvent(screen.getByTestId("panel"), "layout", layout(300, 80))
    await fireEvent(
      screen.getByText("Ships in two days."),
      "layout",
      layout(300, 120)
    )
    expect(height()).toBe(120)
    await fireEvent.press(trigger("Shipping"))
    expect(height()).toBe(80)
  })

  test("a panel inside a nested accordion follows its own item", async () => {
    await render(
      <Accordion defaultValue={["billing"]}>
        <AccordionItem value="billing">
          <AccordionTrigger>
            <Text>Billing</Text>
          </AccordionTrigger>
          <AccordionPanel>
            <Accordion>
              <AccordionItem value="invoices">
                <AccordionTrigger>
                  <Text>Invoices</Text>
                </AccordionTrigger>
                <AccordionPanel
                  testID="invoices-panel"
                  onExit={() => {}}
                  style={(state) => ({ opacity: state.endingStyle ? 0 : 1 })}
                >
                  <Text>Every invoice from the last two years.</Text>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    )
    await fireEvent.press(trigger("Invoices"))
    expect(
      screen.getByText("Every invoice from the last two years.")
    ).toBeVisible()
    expect(trigger("Billing")).toBeExpanded()
    await fireEvent.press(trigger("Invoices"))
    expect(
      screen.getByTestId("invoices-panel", { includeHiddenElements: true })
    ).toHaveStyle({ opacity: 0 })
    expect(trigger("Billing")).toBeExpanded()
  })
})
