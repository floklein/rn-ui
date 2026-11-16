import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { DeviceEventEmitter, Platform, Pressable, Text, View } from "react-native"
import {
  createDialogController,
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../src/dialog"
import { OverlayHost } from "../src/overlays"

const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
afterEach(() => warn.mockClear())

type Node = {
  type: unknown
  props: Record<string, any>
  parent: Node | null
}

const node = (testID: string) =>
  screen.queryByTestId(testID) as unknown as Node | null

function ancestors(start: Node | null) {
  const found: Node[] = []
  for (let at = start?.parent ?? null; at; at = at.parent) {
    found.push(at)
  }
  return found
}

const isInside = (testID: string, outer: string) =>
  ancestors(node(testID)).some((at) => at.props.testID === outer)

const modals = (testID: string) =>
  ancestors(node(testID)).filter((at) => at.type === "Modal").length

function Profile({
  name,
  ...props
}: React.ComponentProps<typeof Dialog> & { name: string }) {
  return (
    <Dialog {...props}>
      <DialogTrigger>
        <Text>Open {name}</Text>
      </DialogTrigger>
      <DialogBackdrop testID={`${name}-backdrop`} />
      <DialogContent testID={`${name}-content`}>
        <DialogTitle>{name}</DialogTitle>
        {props.children}
        <DialogClose>
          <Text>Close {name}</Text>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

// React Native's touch events bubble through every view to the root, which
// fireEvent doesn't do.
async function tap(testID: string) {
  const target = node(testID)!
  const path = [target, ...ancestors(target)]
  const nativeEvent = { pageX: 10, pageY: 10 }
  await act(() => {
    for (const at of path) {
      at.props.onTouchStart?.({ nativeEvent })
    }
    for (const at of path) {
      at.props.onTouchEnd?.({ nativeEvent })
    }
  })
  if (target.props.onPress || target.props.onClick) {
    await fireEvent.press(screen.getByTestId(testID))
  }
}

const open = (name: string) =>
  fireEvent.press(screen.getByRole("button", { name: `Open ${name}` }))

describe("OverlayHost", () => {
  test("a non-modal dialog renders in the root host, not where its root is", async () => {
    await render(
      <OverlayHost>
        <View testID="screen">
          <Profile name="notes" modal={false} />
        </View>
      </OverlayHost>
    )
    await open("notes")
    expect(node("notes-content")).not.toBeNull()
    expect(isInside("notes-content", "screen")).toBe(false)
    expect(modals("notes-content")).toBe(0)
    expect(warn).not.toHaveBeenCalled()
  })

  test("with no host, a non-modal dialog warns in development and renders in place", async () => {
    await render(
      <View testID="screen">
        <Profile name="notes" modal={false} />
      </View>
    )
    await open("notes")
    expect(isInside("notes-content", "screen")).toBe(true)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.lastCall?.join(" ")).toMatch(/OverlayHost/)
  })

  test("a modal dialog needs no host", async () => {
    await render(<Profile name="profile" />)
    await open("profile")
    expect(modals("profile-content")).toBe(1)
    expect(warn).not.toHaveBeenCalled()
  })

  test("a dialog opened from a modal dialog renders inside its Modal", async () => {
    await render(
      <OverlayHost>
        <Profile name="profile">
          <Profile name="notes" modal={false} />
          <Profile name="confirm" />
        </Profile>
      </OverlayHost>
    )
    await open("profile")
    await open("notes")
    expect(modals("notes-content")).toBe(1)
    await open("confirm")
    expect(modals("confirm-content")).toBe(2)
  })

  test("a dialog opened from code while a modal one is open renders inside its Modal, not beside it", async () => {
    const controller = createDialogController()
    await render(
      <OverlayHost>
        <Profile name="profile" />
        <Profile name="sibling" controller={controller} />
      </OverlayHost>
    )
    await open("profile")
    await act(() => {
      controller.open()
    })
    expect(modals("sibling-content")).toBe(2)
  })

  test("a press outside a non-modal dialog reaches what is under it, and closes it with the outside-press reason", async () => {
    const onOpenChange = jest.fn()
    const under = jest.fn()
    await render(
      <OverlayHost>
        <Pressable testID="under" onPress={under}>
          <Text>Under</Text>
        </Pressable>
        <Profile
          name="notes"
          modal={false}
          closeOnOutsidePress
          onOpenChange={onOpenChange}
        />
      </OverlayHost>
    )
    await open("notes")
    await tap("notes-content")
    expect(node("notes-content")).not.toBeNull()
    await tap("under")
    expect(under).toHaveBeenCalledTimes(1)
    expect(node("notes-content")).toBeNull()
    expect(onOpenChange.mock.lastCall).toMatchObject([
      false,
      { reason: "outside-press", source: "touch" },
    ])
  })

  test("by default a press outside a non-modal dialog goes through and leaves it open", async () => {
    const under = jest.fn()
    await render(
      <OverlayHost>
        <Pressable testID="under" onPress={under}>
          <Text>Under</Text>
        </Pressable>
        <Profile name="notes" modal={false} />
      </OverlayHost>
    )
    await open("notes")
    await tap("under")
    expect(under).toHaveBeenCalledTimes(1)
    expect(node("notes-content")).not.toBeNull()
  })

  test("a press inside a modal dialog closes the non-modal one above it and keeps the modal one", async () => {
    await render(
      <OverlayHost>
        <Profile name="profile">
          <Profile name="notes" modal={false} closeOnOutsidePress />
        </Profile>
      </OverlayHost>
    )
    await open("profile")
    await open("notes")
    await tap("profile-content")
    expect(node("notes-content")).toBeNull()
    expect(node("profile-content")).not.toBeNull()
  })

  test("Android's back closes the topmost non-modal dialog in the root host", async () => {
    if (Platform.OS !== "android") {
      return
    }
    await render(
      <OverlayHost>
        <Profile name="notes" modal={false} />
        <Profile name="tips" modal={false} />
      </OverlayHost>
    )
    await open("notes")
    await open("tips")
    await act(() => {
      DeviceEventEmitter.emit("hardwareBackPress")
    })
    expect(node("tips-content")).toBeNull()
    expect(node("notes-content")).not.toBeNull()
  })
})
