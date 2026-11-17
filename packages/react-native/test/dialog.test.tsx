import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { createContext, createRef, use } from "react"
import {
  AccessibilityInfo,
  DeviceEventEmitter,
  Platform,
  Text,
  TextInput,
  type HostInstance,
} from "react-native"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
  createAlertDialogController,
} from "../src/alert-dialog"
import {
  createDialogController,
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../src/dialog"
import { dialog } from "@ui-sdk/core/dialog"
import "../src/calendar"
import { carried, carry } from "../src/carried-context"
import "../src/checkbox"
import { FieldSet } from "../src/field"
import "../src/file-input"
import "../src/input"
import "../src/rating"
import "../src/scroll-area"
import { Switch } from "../src/switch"
import "../src/tabs"
import "../src/toggle"

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

afterEach(() => sendAccessibilityEvent.mockClear())

const trigger = () => screen.getByRole("button", { name: "Edit profile" })
const focusedViews = () =>
  sendAccessibilityEvent.mock.calls.map(([view]) => view)
const content = () => screen.queryByTestId("content")
const backdrop = () =>
  screen.getByTestId("backdrop", { includeHiddenElements: true })

function inModal(node: { type: unknown; parent: unknown } | null): boolean {
  return !!node && (node.type === "Modal" || inModal(node.parent as never))
}

const modal = () => {
  let node = content() as { type: unknown; parent: unknown } | null
  while (node && node.type !== "Modal") {
    node = node.parent as never
  }
  return node as { props: { onRequestClose: () => void } } | null
}

const triggerRef = createRef<HostInstance>()
const cancelRef = createRef<HostInstance>()

function Profile(props: React.ComponentProps<typeof Dialog>) {
  return (
    <Dialog {...props}>
      <DialogTrigger ref={triggerRef}>
        <Text>Edit profile</Text>
      </DialogTrigger>
      <DialogBackdrop testID="backdrop" />
      <DialogContent testID="content">
        <DialogTitle>Profile</DialogTitle>
        <DialogDescription>Change your name.</DialogDescription>
        <DialogClose>
          <Text>Done</Text>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

describe("Dialog", () => {
  test("a press on the trigger opens the content in a Modal and asks for focus on its title", async () => {
    const onOpenChange = jest.fn()
    const title = createRef<HostInstance>()
    await render(
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger>
          <Text>Edit profile</Text>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle ref={title}>Profile</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(screen.queryByText("Profile")).toBeNull()
    await fireEvent.press(trigger())
    expect(onOpenChange.mock.calls[0][1]).toMatchObject({
      reason: "trigger-press",
      source: "touch",
    })
    expect(inModal(screen.getByText("Profile"))).toBe(true)
    expect(screen.getByRole("header", { name: "Profile" })).toBeVisible()
    expect(focusedViews().at(-1) === title.current).toBe(true)
  })

  test("Android's back closes it with the back reason, and focus returns to the trigger", async () => {
    const onOpenChange = jest.fn()
    await render(<Profile onOpenChange={onOpenChange} />)
    await fireEvent.press(trigger())
    await act(() => modal()!.props.onRequestClose())
    expect(onOpenChange.mock.lastCall).toMatchObject([
      false,
      { reason: "back", source: "touch" },
    ])
    expect(content()).toBeNull()
    expect(focusedViews().at(-1) === triggerRef.current).toBe(true)
  })

  test("a refused back still takes it: the dialog stays open and the app hears the attempt", async () => {
    const onDismissAttempt = jest.fn()
    await render(
      <Profile dismissible={false} onDismissAttempt={onDismissAttempt} />
    )
    await fireEvent.press(trigger())
    await act(() => modal()!.props.onRequestClose())
    expect(onDismissAttempt.mock.lastCall?.[0]).toMatchObject({
      reason: "back",
    })
    expect(content()).not.toBeNull()
  })

  test("a press on the backdrop closes it with the outside-press reason", async () => {
    const onOpenChange = jest.fn()
    await render(<Profile onOpenChange={onOpenChange} />)
    await fireEvent.press(trigger())
    await fireEvent.press(backdrop())
    expect(onOpenChange.mock.lastCall).toMatchObject([
      false,
      { reason: "outside-press", source: "touch" },
    ])
    expect(content()).toBeNull()
  })

  test("closeOnOutsidePress false keeps it open on a backdrop press", async () => {
    await render(<Profile closeOnOutsidePress={false} />)
    await fireEvent.press(trigger())
    await fireEvent.press(backdrop())
    expect(content()).not.toBeNull()
  })

  test("VoiceOver's escape gesture on the content closes it with the escape-key reason", async () => {
    const onOpenChange = jest.fn()
    await render(<Profile onOpenChange={onOpenChange} />)
    await fireEvent.press(trigger())
    await act(() => content()!.props.onAccessibilityEscape())
    expect(onOpenChange.mock.lastCall).toMatchObject([
      false,
      { reason: "escape-key", source: "virtual" },
    ])
  })

  test("a non-modal dialog renders in place, and the escape gesture closes it only from its content", async () => {
    const controller = createDialogController()
    await render(<Profile modal={false} controller={controller} />)
    await fireEvent.press(trigger())
    expect(inModal(content())).toBe(false)
    expect(backdrop()).not.toBeNull()
    await act(() => content()!.props.onAccessibilityEscape())
    expect(content()).toBeNull()
    await act(() => {
      controller.open()
    })
    const { layerInput } = await import("../src/native-host")
    await act(() => {
      layerInput()?.escape()
    })
    expect(content()).not.toBeNull()
  })

  test("a Close part closes it with its value, and focus returns to the trigger", async () => {
    const controller = createDialogController()
    await render(<Profile controller={controller} />)
    let result: unknown
    await act(() => {
      controller.open().then((closed) => (result = closed))
    })
    await fireEvent.press(screen.getByRole("button", { name: "Done" }))
    expect(result).toMatchObject({ reason: "close-press", source: "touch" })
    expect(focusedViews().at(-1) === triggerRef.current).toBe(true)
  })

  test("finalFocus none leaves focus where it is on close", async () => {
    await render(
      <Dialog>
        <DialogTrigger>
          <Text>Edit profile</Text>
        </DialogTrigger>
        <DialogContent testID="content" finalFocus="none">
          <DialogTitle>Profile</DialogTitle>
          <DialogClose>
            <Text>Done</Text>
          </DialogClose>
        </DialogContent>
      </Dialog>
    )
    await fireEvent.press(trigger())
    sendAccessibilityEvent.mockClear()
    await fireEvent.press(screen.getByRole("button", { name: "Done" }))
    expect(sendAccessibilityEvent).not.toHaveBeenCalled()
  })

  test("onExit keeps the content and the Modal until done, and only then completes the close", async () => {
    const onOpenChangeComplete = jest.fn()
    let done = () => {}
    await render(
      <Dialog onOpenChangeComplete={onOpenChangeComplete}>
        <DialogTrigger>
          <Text>Edit profile</Text>
        </DialogTrigger>
        <DialogContent
          testID="content"
          onExit={(end) => (done = end)}
          style={(state) => ({ opacity: state.endingStyle ? 0 : 1 })}
        >
          <DialogTitle>Profile</DialogTitle>
          <DialogClose>
            <Text>Done</Text>
          </DialogClose>
        </DialogContent>
      </Dialog>
    )
    await fireEvent.press(trigger())
    await fireEvent.press(screen.getByRole("button", { name: "Done" }))
    expect(
      screen.getByTestId("content", { includeHiddenElements: true })
    ).toBeTruthy()
    expect(onOpenChangeComplete.mock.calls).toEqual([[true]])
    await act(() => done())
    expect(content()).toBeNull()
    expect(onOpenChangeComplete.mock.calls).toEqual([[true], [false]])
  })

  test("focus returns to the trigger once the content has left, not while its exit holds the Modal", async () => {
    let done = () => {}
    await render(
      <Dialog>
        <DialogTrigger ref={triggerRef}>
          <Text>Edit profile</Text>
        </DialogTrigger>
        <DialogContent testID="content" onExit={(end) => (done = end)}>
          <DialogTitle>Profile</DialogTitle>
          <DialogClose>
            <Text>Done</Text>
          </DialogClose>
        </DialogContent>
      </Dialog>
    )
    await fireEvent.press(trigger())
    sendAccessibilityEvent.mockClear()
    await fireEvent.press(screen.getByRole("button", { name: "Done" }))
    expect(sendAccessibilityEvent).not.toHaveBeenCalled()
    await act(() => done())
    expect(content()).toBeNull()
    expect(focusedViews().at(-1) === triggerRef.current).toBe(true)
  })

  test("Android's back closes a non-modal dialog through BackHandler", async () => {
    if (Platform.OS !== "android") {
      return
    }
    const onOpenChange = jest.fn()
    await render(<Profile modal={false} onOpenChange={onOpenChange} />)
    await fireEvent.press(trigger())
    await act(() => {
      DeviceEventEmitter.emit("hardwareBackPress")
    })
    expect(onOpenChange.mock.lastCall).toMatchObject([
      false,
      { reason: "back", source: "touch" },
    ])
  })

  test("a controlled open closes through the same exit", async () => {
    let done = () => {}
    const tree = (open: boolean) => (
      <Dialog open={open}>
        <DialogContent testID="content" onExit={(end) => (done = end)}>
          <DialogTitle>Profile</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    const { rerender } = await render(tree(true))
    expect(content()).not.toBeNull()
    await rerender(tree(false))
    expect(
      screen.getByTestId("content", { includeHiddenElements: true })
    ).toBeTruthy()
    await act(() => done())
    expect(content()).toBeNull()
  })

  test("unmounting it while open resolves the controller's open with unmount and stops listening", async () => {
    const controller = createDialogController()
    const { unmount } = await render(<Profile controller={controller} />)
    let result: unknown
    await act(() => {
      controller.open().then((closed) => (result = closed))
    })
    const { layerInput } = await import("../src/native-host")
    expect(layerInput()).toBeDefined()
    await unmount()
    await act(async () => {})
    expect(result).toMatchObject({ reason: "unmount" })
    expect(layerInput()).toBeUndefined()
  })

  test("a trigger outside the dialog opens it through the controller, with its payload", async () => {
    const controller = createDialogController<string>()
    const tree = (shown: boolean) => (
      <>
        <DialogTrigger controller={controller} payload="Globex">
          <Text>Remind Globex</Text>
        </DialogTrigger>
        {shown && (
          <Dialog controller={controller}>
            <DialogContent testID="content">
              {(state) => (
                <DialogTitle>Remind {String(state.payload)}</DialogTitle>
              )}
            </DialogContent>
          </Dialog>
        )}
      </>
    )
    const { rerender } = await render(tree(false))
    const remind = () => screen.getByRole("button", { name: "Remind Globex" })
    await fireEvent.press(remind())
    expect(content()).toBeNull()
    await rerender(tree(true))
    await fireEvent.press(remind())
    expect(screen.getByRole("header", { name: "Remind Globex" })).toBeVisible()
  })
})

describe("AlertDialog", () => {
  function Discard() {
    return (
      <AlertDialog controller={alert}>
        <AlertDialogTrigger>
          <Text>Discard draft</Text>
        </AlertDialogTrigger>
        <AlertDialogBackdrop testID="backdrop" />
        <AlertDialogContent testID="content">
          <AlertDialogTitle>Discard the draft?</AlertDialogTitle>
          <AlertDialogClose ref={cancelRef}>
            <Text>Cancel</Text>
          </AlertDialogClose>
          <AlertDialogClose value="confirm">
            <Text>Discard</Text>
          </AlertDialogClose>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  const alert = createAlertDialogController()

  test("a backdrop press is an attempt that keeps it open", async () => {
    await render(<Discard />)
    await fireEvent.press(screen.getByRole("button", { name: "Discard draft" }))
    await fireEvent.press(backdrop())
    expect(content()).not.toBeNull()
  })

  test("opened from code, focus starts on its first Close part", async () => {
    await render(<Discard />)
    await act(() => {
      alert.open()
    })
    expect(focusedViews().at(-1) === cancelRef.current).toBe(true)
  })
})

describe("the adapter's contexts inside the Modal", () => {
  test("a disabled FieldSet between the dialog and its content disables the controls inside", async () => {
    const onCheckedChange = jest.fn()
    await render(
      <Dialog defaultOpen>
        <FieldSet disabled>
          <DialogContent>
            <DialogTitle>Alerts</DialogTitle>
            <Switch testID="switch" onCheckedChange={onCheckedChange} />
          </DialogContent>
        </FieldSet>
      </Dialog>
    )
    const control = screen.getByTestId("switch")
    expect(inModal(control)).toBe(true)
    expect(control.props.accessibilityState).toMatchObject({ disabled: true })
    await fireEvent.press(control)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test("every context the adapter owns reaches the content with the value it has where the content renders", async () => {
    const own = [...carried]
      .map((context) => context.displayName)
      .filter((name) => !name?.endsWith("Scope"))
      .sort()
    expect(own).toEqual([
      "Calendar",
      "CalendarGrid",
      "CheckboxGroup",
      "Described",
      "Disabled",
      "Field",
      "FileInputFile",
      "InputGroup",
      "Outlet",
      "RatingItem",
      "ScrollAreaOrientation",
      "ScrollHold",
      "TabsLayouts",
      "ToggleGroup",
      "Toolbar",
      "ToolbarGroup",
    ])
    const scopes = [...carried].filter((context) =>
      context.displayName?.endsWith("Scope")
    )
    expect(scopes.length).toBeGreaterThan(1)

    const dialogScope = `${dialog.name}Scope`
    const replaced = [...carried].filter(
      (context) =>
        context.displayName !== "Outlet" && context.displayName !== dialogScope
    )
    const read = new Map<string, Map<React.Context<any>, unknown>>()
    function Probe({ at }: { at: string }) {
      const values = new Map<React.Context<any>, unknown>()
      for (const context of carried) {
        values.set(context, use(context))
      }
      read.set(at, values)
      return null
    }
    let between: React.ReactNode = (
      <>
        <Probe at="between" />
        <DialogContent>
          <DialogTitle>Alerts</DialogTitle>
          <Probe at="inside" />
        </DialogContent>
      </>
    )
    for (const Context of replaced) {
      between = (
        <Context value={{ from: Context.displayName }}>{between}</Context>
      )
    }
    await render(<Dialog defaultOpen>{between}</Dialog>)

    const outside = read.get("between")!
    const inside = read.get("inside")!
    for (const context of carried) {
      expect([context.displayName, inside.get(context)]).toEqual([
        context.displayName,
        outside.get(context),
      ])
    }
    for (const context of replaced) {
      expect(inside.get(context)).toEqual({ from: context.displayName })
    }
  })

  test("a context first made while the dialog is open keeps the content mounted", async () => {
    function Name({ title }: { title: string }) {
      return (
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>{title}</DialogTitle>
            <TextInput testID="name" />
          </DialogContent>
        </Dialog>
      )
    }
    await render(<Name title="Name" />)
    const before = screen.getByTestId("name")
    carry("LateScope", createContext(null))
    await screen.rerender(<Name title="Your name" />)
    expect(screen.getByTestId("name") === before).toBe(true)
  })

  test("every context the adapter makes is carried", () => {
    const sources = readdirSync(join(__dirname, "../src"))
      .filter((file) => file !== "check-pattern.ts")
      .map((file) => readFileSync(join(__dirname, "../src", file), "utf8"))
      .join("\n")
    const made = sources.match(/createContext[<(]/g)!.length
    const carriedMade = sources.match(
      /carry\([^,]+,\s*React\.createContext[<(]/g
    )!
    // Where a popup renders: a Modal's host replaces it inside the Modal.
    const hosts = sources.match(/const HostContext = React\.createContext/g)!
    expect(carriedMade.length + hosts.length).toBe(made)
  })
})
