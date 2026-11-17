import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import { I18nManager, StyleSheet, Text, type HostInstance } from "react-native"
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
  DrawerTrigger,
} from "../src/drawer"

// Gesture Handler's state calls go to its native module, which Jest lacks.
const states: [number, number][] = []
Object.assign(globalThis, {
  _setGestureStateAsync: (tag: number, state: number) =>
    states.push([tag, state]),
})
const active = 4

afterEach(() => {
  states.length = 0
})

function Sheet(props: React.ComponentProps<typeof Drawer>) {
  return (
    <Drawer {...props}>
      <DrawerTrigger>
        <Text>Open drawer</Text>
      </DrawerTrigger>
      <DrawerBackdrop testID="backdrop" />
      <DrawerContent testID="content">
        <DrawerHandle aria-label="Resize" testID="handle" />
        <DrawerTitle>Move goal</DrawerTitle>
        <DrawerDescription>Set your daily activity goal.</DrawerDescription>
        <DrawerClose>
          <Text>Cancel</Text>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  )
}

const content = () =>
  screen.queryByTestId("content", { includeHiddenElements: true })

// The screen is 800 tall and the content 400, as the views report on a device.
async function layOut() {
  const view = content()!
  await fireEvent(view.parent!.parent!, "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } },
  })
  await fireEvent(view, "layout", {
    nativeEvent: { layout: { x: 0, y: 400, width: 400, height: 400 } },
  })
}

const settled = () => act(() => new Promise((done) => setTimeout(done, 700)))

const detector = () => content()!.parent!
const tag = () => detector().props.handlerTags[0]

function touch(eventType: number, y: number) {
  return act(() =>
    detector().props.onGestureHandlerTouchEvent({
      handlerTag: tag(),
      state: 2,
      eventType,
      numberOfTouches: 1,
      allTouches: [{ id: 0, x: 200, y, absoluteX: 200, absoluteY: y }],
      changedTouches: [{ id: 0, x: 200, y, absoluteX: 200, absoluteY: y }],
      pointerType: 0,
    })
  )
}

function finish() {
  return act(() =>
    detector().props.onGestureHandlerStateChange({
      handlerTag: tag(),
      state: 5,
      oldState: 4,
      handlerData: { velocityX: 0, velocityY: 2000, numberOfPointers: 1 },
    })
  )
}

describe("Drawer", () => {
  test("a press on the trigger opens the content in a Modal, a dialog named by its title", async () => {
    await render(<Sheet />)
    await fireEvent.press(screen.getByRole("button", { name: "Open drawer" }))
    await layOut()
    expect(content()).not.toBeNull()
    let node = content()!.parent
    while (node && node.type !== "Modal") {
      node = node.parent
    }
    expect(node?.props.visible).toBe(true)
    await settled()
    expect(screen.getByTestId("handle").props.accessibilityRole).toBe(
      "adjustable"
    )
  })

  test("a drag toward the edge claims the touch and dismisses with the swipe reason", async () => {
    const onOpenChange = jest.fn()
    await render(<Sheet defaultOpen onOpenChange={onOpenChange} />)
    await layOut()
    await settled()
    await touch(1, 500)
    for (const y of [510, 540, 600, 700]) {
      await touch(2, y)
    }
    expect(states.some(([, state]) => state === active)).toBe(true)
    await finish()
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "swipe" })
    )
    await settled()
    expect(content()).toBeNull()
  })

  test("a close press plays the drawer out before the content leaves", async () => {
    await render(<Sheet defaultOpen />)
    await layOut()
    await settled()
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }))
    expect(content()).not.toBeNull()
    await settled()
    expect(content()).toBeNull()
  })

  test("the handle's increment moves to the next snap point", async () => {
    const onSnapPointChange = jest.fn()
    await render(
      <Sheet
        defaultOpen
        snapPoints={[0.25, 0.5]}
        onSnapPointChange={onSnapPointChange}
      />
    )
    await layOut()
    await settled()
    await fireEvent(screen.getByTestId("handle"), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    })
    expect(onSnapPointChange).toHaveBeenCalledWith(
      0.5,
      expect.objectContaining({ reason: "handle-key" })
    )
  })

  test("a press on the backdrop closes it with the outside-press reason", async () => {
    const onOpenChange = jest.fn()
    await render(<Sheet defaultOpen onOpenChange={onOpenChange} />)
    await layOut()
    await fireEvent.press(
      screen.getByTestId("backdrop", { includeHiddenElements: true })
    )
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "outside-press" })
    )
  })

  test("a user's backdrop press and content ref merge with the drawer's", async () => {
    const onOpenChange = jest.fn()
    const onPress = jest.fn()
    const ref = createRef<HostInstance>()
    await render(
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <DrawerBackdrop testID="backdrop" onPress={onPress} />
        <DrawerContent testID="content" ref={ref}>
          <DrawerTitle>Move goal</DrawerTitle>
        </DrawerContent>
      </Drawer>
    )
    expect(ref.current).not.toBeNull()
    await fireEvent.press(
      screen.getByTestId("backdrop", { includeHiddenElements: true })
    )
    expect(onPress).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "outside-press" })
    )
  })

  test("right to left, a drawer from the start edge sits at the right", async () => {
    const isRTL = jest.replaceProperty(I18nManager, "isRTL", true)
    await render(<Sheet defaultOpen side="start" />)
    await layOut()
    const viewport = content()!.parent!.parent!
    expect(StyleSheet.flatten(viewport.props.style)).toMatchObject({
      flexDirection: "row",
      justifyContent: "flex-start",
    })
    isRTL.restore()
  })
})
