import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import {
  AccessibilityInfo,
  Animated,
  DeviceEventEmitter,
  I18nManager,
  Platform,
  StyleSheet,
  Text,
  View,
  type HostInstance,
} from "react-native"
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

// The screen is the window; Jest's views share one measureInWindow mock.
let measureInWindow: jest.Mock | undefined
beforeEach(async () => {
  const ref = createRef<HostInstance>()
  await render(<View ref={ref} />)
  measureInWindow = ref.current!.measureInWindow as unknown as jest.Mock
  measureInWindow.mockImplementation((onSuccess) => onSuccess(0, 0, 400, 800))
})
afterEach(() => measureInWindow?.mockReset())

function keyboard(height: number) {
  const coordinates = { screenX: 0, screenY: 800 - height, width: 400, height }
  return act(() => {
    if (Platform.OS === "ios") {
      DeviceEventEmitter.emit("keyboardWillChangeFrame", {
        duration: 250,
        easing: "keyboard",
        endCoordinates: coordinates,
      })
    } else {
      DeviceEventEmitter.emit(height ? "keyboardDidShow" : "keyboardDidHide", {
        duration: 0,
        easing: "keyboard",
        endCoordinates: coordinates,
      })
    }
  })
}

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
async function layOut(height = 400) {
  const view = content()!
  await fireEvent(view.parent!.parent!, "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } },
  })
  await fireEvent(view, "layout", {
    nativeEvent: { layout: { x: 0, y: 800 - height, width: 400, height } },
  })
}

const frame = () => content()!.parent!.parent!
const style = (node: { props: { style?: unknown } }) =>
  StyleSheet.flatten(node.props.style as never) as Record<string, any>
const transform = (node: { props: { style?: unknown } }) =>
  Object.assign({}, ...style(node).transform)

const settled = () => act(() => new Promise((done) => setTimeout(done, 700)))

const detector = (view = content()!) => view.parent!
const tag = () => detector().props.handlerTags[0]

function touch(eventType: number, y: number, view = content()!) {
  return act(() =>
    detector(view).props.onGestureHandlerTouchEvent({
      handlerTag: detector(view).props.handlerTags[0],
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

  test("the drawer slides above the keyboard from where it was, and back down when it hides", async () => {
    await render(<Sheet defaultOpen />)
    await layOut()
    await settled()
    await keyboard(300)
    expect(style(frame())).toMatchObject({
      paddingBottom: 300,
      transform: [{ translateY: 300 }],
    })
    await keyboard(0)
    expect(style(frame())).toMatchObject({
      paddingBottom: 0,
      transform: [{ translateY: -300 }],
    })
  })

  test("a drawer taller than the room above the keyboard keeps its height", async () => {
    await render(<Sheet defaultOpen />)
    await layOut(700)
    await settled()
    await keyboard(300)
    expect(style(frame()).paddingBottom).toBe(100)
  })

  test("a press opens it sliding from its edge", async () => {
    await render(<Sheet />)
    await fireEvent.press(screen.getByRole("button", { name: "Open drawer" }))
    await layOut()
    expect(style(content()!).opacity).toBe(1)
    expect(transform(content()!).translateY).toBe(400)
  })

  test("with reduced motion it fades in and out where it rests instead of sliding", async () => {
    jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(true)
    try {
      await render(<Sheet />)
      await fireEvent.press(screen.getByRole("button", { name: "Open drawer" }))
      await layOut()
      expect(style(content()!).opacity).toBe(0)
      expect(transform(content()!).translateY).toBe(0)
      await settled()
      await fireEvent.press(screen.getByRole("button", { name: "Cancel" }))
      expect(style(content()!).opacity).toBe(1)
      expect(transform(content()!).translateY).toBe(0)
      await settled()
      expect(content()).toBeNull()
    } finally {
      jest
        .mocked(AccessibilityInfo.isReduceMotionEnabled)
        .mockResolvedValue(false)
    }
  })

  test("a parent drawer steps back while a drawer opened from it is open, and comes back as it leaves", async () => {
    // Jest's native driver never reports values back, so these run in JavaScript.
    const timing = Animated.timing
    const inJavaScript = jest
      .spyOn(Animated, "timing")
      .mockImplementation((value, config) =>
        timing(value, { ...config, useNativeDriver: false })
      )
    try {
      const tree = (
        <Drawer defaultOpen>
          <DrawerContent testID="content">
            <DrawerTitle>Account</DrawerTitle>
            <Drawer>
              <DrawerTrigger>
                <Text>Change password</Text>
              </DrawerTrigger>
              <DrawerContent testID="child">
                <DrawerTitle>Change password</DrawerTitle>
                <DrawerClose>
                  <Text>Update</Text>
                </DrawerClose>
              </DrawerContent>
            </Drawer>
          </DrawerContent>
        </Drawer>
      )
      const scale = async () => {
        await screen.rerender(tree)
        return transform(content()!).scale
      }
      await render(tree)
      await layOut()
      await settled()
      expect(await scale()).toBe(1)
      await fireEvent.press(
        screen.getByRole("button", { name: "Change password" })
      )
      const child = screen.getByTestId("child", { includeHiddenElements: true })
      await fireEvent(child.parent!.parent!, "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } },
      })
      await fireEvent(child, "layout", {
        nativeEvent: { layout: { x: 0, y: 600, width: 400, height: 200 } },
      })
      await settled()
      expect(await scale()).toBeCloseTo(0.96)
      await fireEvent.press(screen.getByRole("button", { name: "Update" }))
      await settled()
      expect(await scale()).toBeCloseTo(1)
    } finally {
      inJavaScript.mockRestore()
    }
  })
})
