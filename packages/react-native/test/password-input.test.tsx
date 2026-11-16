import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import { AccessibilityInfo, Text, type TextInputInstance } from "react-native"
import {
  createPasswordInputController,
  PasswordInput,
  PasswordInputControl,
  PasswordInputToggle,
} from "../src/password-input"

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

// Jest's TextInput mock shares one focus mock between instances.
afterEach(() => jest.clearAllMocks())

const toggleState = () =>
  screen.getByRole("togglebutton", { name: "Show password" }).props
    .accessibilityState

describe("PasswordInput", () => {
  test("the field hides what's typed, and typing changes the value from the keyboard", async () => {
    const onValueChange = jest.fn()
    await render(
      <PasswordInput onValueChange={onValueChange}>
        <PasswordInputControl aria-label="Password" />
      </PasswordInput>
    )
    const field = screen.getByLabelText("Password")
    expect(field.props.secureTextEntry).toBe(true)
    await fireEvent.changeText(field, "hunter2")
    expect(field).toHaveDisplayValue("hunter2")
    expect(onValueChange).toHaveBeenCalledWith(
      "hunter2",
      expect.objectContaining({ reason: "input-change", source: "keyboard" })
    )
  })

  test("the field asks for a password to fill in, with no correction or capitals", async () => {
    await render(
      <>
        <PasswordInput>
          <PasswordInputControl aria-label="Current" />
        </PasswordInput>
        <PasswordInput autoComplete="new-password">
          <PasswordInputControl aria-label="New" />
        </PasswordInput>
      </>
    )
    expect(screen.getByLabelText("Current").props).toMatchObject({
      autoComplete: "current-password",
      autoCapitalize: "none",
      autoCorrect: false,
      spellCheck: false,
    })
    expect(screen.getByLabelText("New").props.autoComplete).toBe("new-password")
  })

  test("the toggle shows and hides the password, says whether it's shown, and reports toggle-press from a touch", async () => {
    const onVisibleChange = jest.fn()
    await render(
      <PasswordInput onVisibleChange={onVisibleChange}>
        <PasswordInputControl aria-label="Password" />
        <PasswordInputToggle aria-label="Show password" />
      </PasswordInput>
    )
    expect(toggleState()).toMatchObject({ checked: false })
    await fireEvent.press(
      screen.getByRole("togglebutton", { name: "Show password" })
    )
    expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(false)
    expect(toggleState()).toMatchObject({ checked: true })
    expect(onVisibleChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: "toggle-press", source: "touch" })
    )
    await fireEvent.press(
      screen.getByRole("togglebutton", { name: "Show password" })
    )
    expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(true)
  })

  test("a canceled or controlled visibility keeps the password as it was", async () => {
    await render(
      <>
        <PasswordInput
          onVisibleChange={(_visible, details) => details.cancel()}
        >
          <PasswordInputControl aria-label="Canceled" />
          <PasswordInputToggle aria-label="Show canceled" />
        </PasswordInput>
        <PasswordInput visible onVisibleChange={() => {}}>
          <PasswordInputControl aria-label="Controlled" />
          <PasswordInputToggle aria-label="Show controlled" />
        </PasswordInput>
      </>
    )
    await fireEvent.press(screen.getByLabelText("Show canceled"))
    await fireEvent.press(screen.getByLabelText("Show controlled"))
    expect(screen.getByLabelText("Canceled").props.secureTextEntry).toBe(true)
    expect(screen.getByLabelText("Controlled").props.secureTextEntry).toBe(
      false
    )
  })

  test("a disabled one can't be edited or shown; a read-only one can't be edited, so it reads as disabled, but still shows", async () => {
    await render(
      <>
        <PasswordInput disabled defaultValue="secret">
          <PasswordInputControl aria-label="Disabled" />
          <PasswordInputToggle aria-label="Show disabled" />
        </PasswordInput>
        <PasswordInput readOnly defaultValue="secret">
          <PasswordInputControl aria-label="Read-only" />
          <PasswordInputToggle aria-label="Show read-only" />
        </PasswordInput>
      </>
    )
    expect(screen.getByLabelText("Disabled").props.editable).toBe(false)
    expect(
      screen.getByLabelText("Disabled").props.accessibilityState
    ).toMatchObject({ disabled: true })
    expect(screen.getByLabelText("Show disabled")).toBeDisabled()
    await fireEvent.press(screen.getByLabelText("Show disabled"))
    expect(screen.getByLabelText("Disabled").props.secureTextEntry).toBe(true)

    expect(screen.getByLabelText("Read-only").props.editable).toBe(false)
    expect(
      screen.getByLabelText("Read-only").props.accessibilityState
    ).toMatchObject({ disabled: true })
    await fireEvent.press(screen.getByLabelText("Show read-only"))
    expect(screen.getByLabelText("Read-only").props.secureTextEntry).toBe(false)
  })

  test("a field enabled again says so explicitly, since Android keeps a disabled state that's left out", async () => {
    const { rerender } = await render(
      <PasswordInput disabled>
        <PasswordInputControl aria-label="Password" />
      </PasswordInput>
    )
    await rerender(
      <PasswordInput>
        <PasswordInputControl aria-label="Password" />
      </PasswordInput>
    )
    expect(
      screen.getByLabelText("Password").props.accessibilityState
    ).toMatchObject({ disabled: false })
    expect(screen.getByLabelText("Password").props.editable).toBe(true)
  })

  test("a press on its own text starts editing the field, and the root isn't an accessible element", async () => {
    const ref = createRef<TextInputInstance>()
    await render(
      <PasswordInput testID="root">
        <Text>Password</Text>
        <PasswordInputControl aria-label="Password" ref={ref} />
      </PasswordInput>
    )
    await fireEvent.press(screen.getByText("Password"))
    expect(ref.current!.focus).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("root").props.accessible).toBe(false)
  })

  test("a controller writes, shows and focuses it with the imperative reason", async () => {
    const controller = createPasswordInputController()
    const onVisibleChange = jest.fn()
    const ref = createRef<TextInputInstance>()
    await render(
      <PasswordInput controller={controller} onVisibleChange={onVisibleChange}>
        <PasswordInputControl aria-label="Password" ref={ref} />
      </PasswordInput>
    )
    await act(async () => controller.setValue("hunter2"))
    expect(screen.getByLabelText("Password")).toHaveDisplayValue("hunter2")
    await act(async () => controller.toggleVisible())
    expect(controller.isVisible()).toBe(true)
    expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(false)
    expect(onVisibleChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: "imperative" })
    )
    await act(async () => controller.focus())
    expect(ref.current!.focus).toHaveBeenCalledTimes(1)
    expect(sendAccessibilityEvent).toHaveBeenCalledWith(ref.current, "focus")
  })

  test("every part's state says whether it's shown and filled", async () => {
    await render(
      <PasswordInput
        testID="root"
        style={(state) => ({ opacity: state.filled ? 1 : 0.5 })}
      >
        <PasswordInputControl aria-label="Password" />
        <PasswordInputToggle aria-label="Show password">
          {(state) => <Text>{state.visible ? "Hide" : "Show"}</Text>}
        </PasswordInputToggle>
      </PasswordInput>
    )
    expect(screen.getByTestId("root")).toHaveStyle({ opacity: 0.5 })
    expect(screen.getByText("Show")).toBeOnTheScreen()
    await fireEvent.changeText(screen.getByLabelText("Password"), "x")
    await fireEvent.press(screen.getByLabelText("Show password"))
    expect(screen.getByTestId("root")).toHaveStyle({ opacity: 1 })
    expect(screen.getByText("Hide")).toBeOnTheScreen()
  })
})
