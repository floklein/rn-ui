import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import {
  AccessibilityInfo,
  Platform,
  Text,
  type HostInstance,
} from "react-native"
import { Button } from "../src/button"

const announceForAccessibilityWithOptions = jest.spyOn(
  AccessibilityInfo,
  "announceForAccessibilityWithOptions"
)

function deferred() {
  let resolve!: () => void
  let reject!: (error: unknown) => void
  const promise = new Promise<void>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

afterEach(() => {
  announceForAccessibilityWithOptions.mockClear()
  jest.useRealTimers()
})

describe("Button", () => {
  test("a press runs onPress with the press's event and a touch source", async () => {
    const onPress = jest.fn()
    await render(
      <Button onPress={onPress}>
        <Text>Save</Text>
      </Button>
    )
    const button = screen.getByRole("button", { name: "Save" })
    await fireEvent.press(button, { nativeEvent: { pageX: 4 } })
    expect(onPress).toHaveBeenCalledTimes(1)
    const [event, details] = onPress.mock.calls[0]
    expect(event).toMatchObject({ nativeEvent: { pageX: 4 } })
    expect(details).toEqual({ source: "touch" })
  })

  test("a returned Promise keeps it pending and busy, and presses meanwhile do nothing", async () => {
    const save = deferred()
    const onPress = jest.fn(() => save.promise)
    await render(
      <Button aria-label="Save" onPress={onPress} testID="button">
        {(state) => <Text>{state.pending ? "Saving" : "Save"}</Text>}
      </Button>
    )
    await fireEvent.press(screen.getByTestId("button"))
    expect(screen.getByTestId("button")).toBeBusy()
    expect(screen.getByTestId("button")).toBeDisabled()
    expect(screen.getByText("Saving")).toBeOnTheScreen()
    await fireEvent.press(screen.getByTestId("button"))
    expect(onPress).toHaveBeenCalledTimes(1)
    await act(async () => save.resolve())
    expect(screen.getByTestId("button")).not.toBeBusy()
    expect(screen.getByTestId("button")).toBeEnabled()
    expect(screen.getByText("Save")).toBeOnTheScreen()
  })

  // Android writes busy into the view's description, which hides the text
  // inside it, and rewrites it only from a state that names busy.
  test("once it settles, a labelled button tells Android it isn't busy", async () => {
    const save = deferred()
    await render(
      <Button aria-label="Save" onPress={() => save.promise} testID="button">
        <Text>Save</Text>
      </Button>
    )
    await fireEvent.press(screen.getByTestId("button"))
    await act(async () => save.resolve())
    expect(screen.getByTestId("button").props.accessibilityState?.busy).toBe(
      Platform.OS === "android" ? false : undefined
    )
  })

  test("a button named by its text is busy only on iOS, where busy keeps its name", async () => {
    await render(
      <Button onPress={() => new Promise(() => {})} testID="button">
        <Text>Save</Text>
      </Button>
    )
    await fireEvent.press(screen.getByTestId("button"))
    expect(screen.getByTestId("button").props.accessibilityState?.busy).toBe(
      Platform.OS === "android" ? undefined : true
    )
    expect(screen.getByTestId("button")).toBeDisabled()
  })

  test("a rejected Promise leaves its reason in the state, and the next press clears it", async () => {
    const save = deferred()
    const onPress = jest.fn(() => save.promise)
    await render(
      <Button onPress={onPress} testID="button">
        {(state) => <Text>{state.error ? "Try Again" : "Save"}</Text>}
      </Button>
    )
    await fireEvent.press(screen.getByTestId("button"))
    await act(async () => save.reject(new Error("offline")))
    expect(screen.getByText("Try Again")).toBeOnTheScreen()
    onPress.mockReturnValueOnce(new Promise(() => {}))
    await fireEvent.press(screen.getByTestId("button"))
    expect(screen.getByText("Save")).toBeOnTheScreen()
  })

  test("after a second pending, the screen reader hears its pendingAnnouncement", async () => {
    jest.useFakeTimers()
    await render(
      <Button
        onPress={() => new Promise(() => {})}
        pendingAnnouncement="Saving"
      >
        <Text>Save</Text>
      </Button>
    )
    await fireEvent.press(screen.getByRole("button"))
    await act(async () => jest.advanceTimersByTime(999))
    expect(announceForAccessibilityWithOptions).not.toHaveBeenCalled()
    await act(async () => jest.advanceTimersByTime(1))
    await act(async () => {})
    expect(announceForAccessibilityWithOptions).toHaveBeenCalledTimes(1)
    expect(announceForAccessibilityWithOptions).toHaveBeenCalledWith("Saving", {
      queue: true,
    })
  })

  test("an action that settles within a second says nothing", async () => {
    jest.useFakeTimers()
    const save = deferred()
    await render(
      <Button onPress={() => save.promise}>
        <Text>Save</Text>
      </Button>
    )
    await fireEvent.press(screen.getByRole("button"))
    await act(async () => save.resolve())
    await act(async () => jest.advanceTimersByTime(2000))
    expect(announceForAccessibilityWithOptions).not.toHaveBeenCalled()
  })

  test("a disabled button ignores a press and is disabled for the screen reader", async () => {
    const onPress = jest.fn()
    await render(
      <Button disabled onPress={onPress}>
        <Text>Save</Text>
      </Button>
    )
    const button = screen.getByRole("button")
    await fireEvent.press(button)
    expect(onPress).not.toHaveBeenCalled()
    expect(button).toBeDisabled()
  })

  test("a button focusable when disabled ignores a press but leaves its Pressable enabled", async () => {
    const onPress = jest.fn()
    await render(
      <Button disabled focusableWhenDisabled onPress={onPress} testID="button">
        <Text>Publish</Text>
      </Button>
    )
    await fireEvent.press(screen.getByTestId("button"))
    expect(onPress).not.toHaveBeenCalled()
    expect(screen.getByTestId("button")).toBeDisabled()
    expect(screen.getByTestId("button").props.disabled).toBeUndefined()
  })

  test("a ref reaches the Pressable's view", async () => {
    const ref = createRef<HostInstance>()
    await render(
      <Button ref={ref} testID="button">
        <Text>Save</Text>
      </Button>
    )
    expect(ref.current).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({ testID: "button" }),
      })
    )
  })

  test("render receives the native props, the state and the interaction", async () => {
    const onPress = jest.fn()
    await render(
      <Button
        onPress={onPress}
        render={(props, state, interaction) => (
          <Text {...props} testID="link">
            {`${state.pending}:${interaction.pressed}`}
          </Text>
        )}
      />
    )
    const link = screen.getByTestId("link")
    expect(link.props.accessibilityRole).toBe("button")
    expect(link).toHaveTextContent("false:false")
    await fireEvent.press(link)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  test("a role it's given wins over the button role, as on a web button", async () => {
    await render(
      <Button role="link">
        <Text>Get Started</Text>
      </Button>
    )
    expect(screen.getByRole("link", { name: "Get Started" })).toBeOnTheScreen()
    expect(screen.queryByRole("button")).toBeNull()
  })

  test("a role React Native has no counterpart for leaves it a button", async () => {
    await render(
      <Button role="group">
        <Text>Save</Text>
      </Button>
    )
    expect(screen.getByRole("button", { name: "Save" })).toBeOnTheScreen()
  })
})
