import { act, fireEvent, render, screen } from "@testing-library/react-native"
import type { ReactNode } from "react"
import { AccessibilityInfo, AppState, Modal, Text } from "react-native"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../src/dialog"
import { OverlayHost } from "../src/overlays"
import {
  createToaster,
  toast,
  Toast,
  ToastAction,
  ToastClose,
  type Toaster,
  ToastRegion,
  type ToastState,
  ToastTitle,
} from "../src/toast"

type Node = { type: unknown; parent: Node | null }

function modals(node: Node) {
  let count = 0
  for (let at = node.parent; at; at = at.parent) {
    count += at.type === "Modal" ? 1 : 0
  }
  return count
}

const announced = jest.spyOn(
  AccessibilityInfo,
  "announceForAccessibilityWithOptions"
)
// Core warns a second after the shared toaster opens with no host mounted.
jest.spyOn(console, "warn").mockImplementation(() => {})

beforeEach(() => jest.useFakeTimers())
afterEach(async () => {
  await act(async () => {
    toast.dismiss()
    jest.runOnlyPendingTimers()
  })
  jest.useRealTimers()
  announced.mockClear()
})

const touch = (x: number, y = 0) => ({
  nativeEvent: { pageX: x, pageY: y, identifier: 1 },
})

// A closing toast leaves in a microtask, which fake timers hold.
const settle = () =>
  act(async () => {
    jest.runAllTicks()
  })

async function swipe(id: string, points: [number, number][], every = 16) {
  const [first, ...rest] = points
  let root = screen.getByTestId(id)
  expect(root.props.onStartShouldSetResponder()).toBe(true)
  await fireEvent(root, "responderGrant", touch(...first))
  for (const point of rest) {
    await act(async () => {
      jest.advanceTimersByTime(every)
    })
    root = screen.getByTestId(id)
    await fireEvent(root, "responderMove", touch(...point))
  }
  return root
}

function Region({
  toaster,
  onState,
}: {
  toaster: Toaster<ReactNode>
  onState?: (state: ToastState) => void
}) {
  return (
    <ToastRegion toaster={toaster}>
      {(data) => (
        <Toast
          testID={data.id}
          style={(state) => {
            onState?.(state)
            return { transform: [{ translateX: state.swipeX }] }
          }}
        >
          <ToastTitle />
          <ToastAction />
          <ToastClose>
            <Text>Close</Text>
          </ToastClose>
        </Toast>
      )}
    </ToastRegion>
  )
}

describe("toast()", () => {
  test("OverlayHost shows the toast and the screen reader hears it", async () => {
    await render(
      <OverlayHost>
        <Text>App</Text>
      </OverlayHost>
    )
    await act(async () => {
      toast({ title: "Saved", description: "Your changes are live." })
      jest.advanceTimersByTime(500)
    })
    expect(screen.getByText("Saved")).toBeOnTheScreen()
    expect(screen.getByText("Your changes are live.")).toBeOnTheScreen()
    expect(announced).toHaveBeenCalledWith("Saved. Your changes are live.", {
      queue: true,
    })
  })

  test("fired while a modal dialog is open, it renders inside that dialog's Modal", async () => {
    await render(
      <OverlayHost>
        <Dialog>
          <DialogTrigger>
            <Text>Edit project</Text>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Edit project</DialogTitle>
          </DialogContent>
        </Dialog>
      </OverlayHost>
    )
    await fireEvent.press(screen.getByRole("button", { name: "Edit project" }))
    await act(async () => {
      toast("Draft saved")
    })
    expect(modals(screen.getByText("Draft saved") as unknown as Node)).toBe(1)
  })

  test("a toast showing as a modal dialog opens moves above it, and back when it closes", async () => {
    await render(
      <OverlayHost>
        <Dialog>
          <DialogTrigger>
            <Text>Edit project</Text>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Edit project</DialogTitle>
            <DialogClose>
              <Text>Close</Text>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </OverlayHost>
    )
    await act(async () => {
      toast({ title: "Draft saved", duration: Infinity })
    })
    expect(modals(screen.getByText("Draft saved") as unknown as Node)).toBe(0)
    await fireEvent.press(screen.getByRole("button", { name: "Edit project" }))
    expect(modals(screen.getByText("Draft saved") as unknown as Node)).toBe(1)
    await fireEvent.press(screen.getByRole("button", { name: "Close" }))
    await act(async () => {
      jest.runOnlyPendingTimers()
    })
    expect(screen.queryByRole("header", { name: "Edit project" })).toBeNull()
    expect(modals(screen.getByText("Draft saved") as unknown as Node)).toBe(0)
  })

  test("an OverlayHost inside the app's own Modal shows the toast once, and it's heard once", async () => {
    const app = (visible: boolean) => (
      <OverlayHost>
        <Modal visible={visible}>
          <OverlayHost>
            <Text>Sheet</Text>
          </OverlayHost>
        </Modal>
      </OverlayHost>
    )
    const { rerender } = await render(app(false))
    await rerender(app(true))
    await act(async () => {
      toast("Saved")
      jest.advanceTimersByTime(500)
    })
    expect(screen.getAllByText("Saved")).toHaveLength(1)
    expect(modals(screen.getByText("Saved") as unknown as Node)).toBe(1)
    expect(
      announced.mock.calls.filter(([text]) => text === "Saved")
    ).toHaveLength(1)
  })

  test("the toast's action runs and dismisses it", async () => {
    const onAction = jest.fn()
    await render(
      <OverlayHost>
        <Text>App</Text>
      </OverlayHost>
    )
    await act(async () => {
      toast({ title: "Deleted", action: { label: "Undo", onAction } })
    })
    await fireEvent.press(screen.getByRole("button", { name: "Undo" }))
    expect(onAction).toHaveBeenCalledTimes(1)
    await act(async () => {
      jest.runOnlyPendingTimers()
    })
    expect(screen.queryByText("Deleted")).toBeNull()
  })

  test("a toast closes after its duration", async () => {
    await render(
      <OverlayHost>
        <Text>App</Text>
      </OverlayHost>
    )
    await act(async () => {
      toast({ title: "Saved", duration: 1000 })
    })
    await act(async () => {
      jest.advanceTimersByTime(999)
    })
    expect(screen.getByText("Saved")).toBeOnTheScreen()
    await act(async () => {
      jest.advanceTimersByTime(1)
    })
    expect(screen.queryByText("Saved")).toBeNull()
  })
})

describe("ToastRegion", () => {
  test("its timers wait while the app is in the background", async () => {
    const listen = jest.spyOn(AppState, "addEventListener")
    await render(
      <OverlayHost>
        <Text>App</Text>
      </OverlayHost>
    )
    await act(async () => {
      toast({ title: "Saved", duration: 1000 })
    })
    const [, change] = listen.mock.calls.at(-1)!
    await act(async () => {
      change("background")
      jest.advanceTimersByTime(2000)
    })
    expect(screen.getByText("Saved")).toBeOnTheScreen()
    await act(async () => {
      change("active")
      jest.advanceTimersByTime(1000)
    })
    expect(screen.queryByText("Saved")).toBeNull()
  })

  test("while a screen reader runs, a toast with an action or a close button waits and a plain one still times out", async () => {
    const [, screenReader] = jest
      .mocked(AccessibilityInfo.addEventListener)
      .mock.calls.find(([event]) => event === "screenReaderChanged")!
    await render(
      <OverlayHost>
        <Text>App</Text>
      </OverlayHost>
    )
    await act(async () => {
      screenReader(true)
      toast({ title: "Saved", duration: 1000 })
      toast({
        title: "Deleted",
        duration: 1000,
        action: { label: "Undo", onAction: () => {} },
      })
      toast({
        title: "Archived",
        duration: 1000,
        cancel: { label: "Dismiss" },
      })
    })
    await act(async () => {
      jest.advanceTimersByTime(5000)
    })
    await settle()
    expect(screen.queryByText("Saved")).toBeNull()
    expect(screen.getByText("Deleted")).toBeOnTheScreen()
    expect(screen.getByText("Archived")).toBeOnTheScreen()
    await act(async () => {
      screenReader(false)
      jest.advanceTimersByTime(1000)
    })
    await settle()
    expect(screen.queryByText("Deleted")).toBeNull()
    expect(screen.queryByText("Archived")).toBeNull()
  })

  test("takes over its toaster, so OverlayHost renders no second region", async () => {
    const toaster = createToaster()
    await render(
      <OverlayHost>
        <Region toaster={toaster} />
      </OverlayHost>
    )
    await act(async () => {
      toaster("Saved")
    })
    expect(screen.getAllByText("Saved")).toHaveLength(1)
    expect(screen.getByRole("button", { name: "Close" })).toBeOnTheScreen()
  })

  test("the close button closes its toast", async () => {
    const toaster = createToaster()
    const onDismiss = jest.fn()
    await render(
      <OverlayHost>
        <Region toaster={toaster} />
      </OverlayHost>
    )
    await act(async () => {
      toaster({ title: "Saved", onDismiss })
    })
    await fireEvent.press(screen.getByRole("button", { name: "Close" }))
    await settle()
    expect(screen.queryByText("Saved")).toBeNull()
    expect(onDismiss).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "close-press" })
    )
  })

  test("sits at the bottom end by default, and at the side and alignment it's given", async () => {
    const toaster = createToaster()
    const { rerender } = await render(
      <OverlayHost>
        <ToastRegion toaster={toaster} testID="region" />
      </OverlayHost>
    )
    await act(async () => {
      toaster({ title: "Saved", duration: Infinity })
    })
    expect(screen.getByTestId("region")).toHaveStyle({
      position: "absolute",
      bottom: 0,
      end: 0,
    })
    await rerender(
      <OverlayHost insets={{ top: 40 }}>
        <ToastRegion
          toaster={toaster}
          testID="region"
          side="top"
          align="center"
          style={{ padding: 8 }}
        />
      </OverlayHost>
    )
    expect(screen.getByTestId("region")).toHaveStyle({
      top: 40,
      start: 0,
      end: 0,
      alignItems: "center",
      padding: 8,
    })
  })
})

describe("swiping a toast", () => {
  test("toward the region's side dismisses it, with the swipe in its state", async () => {
    const toaster = createToaster()
    const onDismiss = jest.fn()
    const states: ToastState[] = []
    await render(
      <OverlayHost>
        <Region toaster={toaster} onState={(state) => states.push(state)} />
      </OverlayHost>
    )
    let id = ""
    await act(async () => {
      id = toaster({ title: "Saved", onDismiss })
    })
    const root = await swipe(id, [
      [100, 0],
      [110, 0],
      [130, 0],
      [180, 0],
    ])
    expect(states.at(-1)).toMatchObject({ swiping: true, swipeX: 80 })
    await fireEvent(root, "responderRelease", touch(180))
    await settle()
    expect(onDismiss).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "swipe" })
    )
    expect(screen.queryByText("Saved")).toBeNull()
  })

  test("a short slow swipe snaps back, and a swipe away from the side resists", async () => {
    const toaster = createToaster()
    const states: ToastState[] = []
    await render(
      <OverlayHost>
        <Region toaster={toaster} onState={(state) => states.push(state)} />
      </OverlayHost>
    )
    let id = ""
    await act(async () => {
      id = toaster({ title: "Saved", duration: Infinity })
    })
    let root = await swipe(id, [
      [100, 0],
      [80, 0],
    ])
    expect(states.at(-1)!.swipeX).toBeGreaterThan(-20)
    expect(states.at(-1)!.swipeX).toBeLessThan(0)
    await fireEvent(root, "responderRelease", touch(80))
    root = await swipe(
      id,
      [
        [100, 0],
        [105, 0],
        [110, 0],
        [115, 0],
      ],
      200
    )
    await fireEvent(root, "responderRelease", touch(115))
    await settle()
    expect(screen.getByText("Saved")).toBeOnTheScreen()
    expect(states.at(-1)).toMatchObject({ swiping: false, swipeX: 0 })
  })

  test("a swipe that starts on a button takes the touch once it moves", async () => {
    const toaster = createToaster()
    await render(
      <OverlayHost>
        <Region toaster={toaster} />
      </OverlayHost>
    )
    let id = ""
    await act(async () => {
      id = toaster({ title: "Saved", duration: Infinity })
    })
    const root = screen.getByTestId(id)
    root.props.onStartShouldSetResponderCapture(touch(100))
    expect(root.props.onMoveShouldSetResponderCapture(touch(103))).toBe(false)
    expect(root.props.onMoveShouldSetResponderCapture(touch(120))).toBe(true)
  })

  test("a second finger doesn't move where the swipe started", async () => {
    const toaster = createToaster()
    await render(
      <OverlayHost>
        <Region toaster={toaster} />
      </OverlayHost>
    )
    let id = ""
    await act(async () => {
      id = toaster({ title: "Saved", duration: Infinity })
    })
    const root = screen.getByTestId(id)
    const finger = (y: number) => ({ pageX: 100, pageY: y })
    root.props.onStartShouldSetResponderCapture({
      nativeEvent: { ...finger(0), touches: [finger(0)] },
    })
    root.props.onStartShouldSetResponderCapture({
      nativeEvent: { ...finger(300), touches: [finger(0), finger(300)] },
    })
    expect(
      root.props.onMoveShouldSetResponderCapture({ nativeEvent: finger(2) })
    ).toBe(false)
  })

  test("a toast that isn't dismissible can't be swiped", async () => {
    const toaster = createToaster()
    await render(
      <OverlayHost>
        <Region toaster={toaster} />
      </OverlayHost>
    )
    let id = ""
    await act(async () => {
      id = toaster({ title: "Uploading", dismissible: false })
    })
    expect(screen.getByTestId(id).props.onStartShouldSetResponder()).toBe(false)
  })

  test("its timer waits while it's swiped", async () => {
    const toaster = createToaster()
    await render(
      <OverlayHost>
        <Region toaster={toaster} />
      </OverlayHost>
    )
    let id = ""
    await act(async () => {
      id = toaster({ title: "Saved", duration: 1000 })
    })
    const root = await swipe(id, [
      [100, 0],
      [115, 0],
    ])
    await act(async () => {
      jest.advanceTimersByTime(2000)
    })
    expect(screen.getByText("Saved")).toBeOnTheScreen()
    await fireEvent(root, "responderTerminate", touch(115))
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    expect(screen.queryByText("Saved")).toBeNull()
  })
})
