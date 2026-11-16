import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef, useState } from "react"
import {
  AccessibilityInfo,
  Pressable,
  Text,
  type TextInputInstance,
} from "react-native"
import { Checkbox, CheckboxGroup } from "../src/checkbox"
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../src/field"
import { Input } from "../src/input"
import { Switch } from "../src/switch"

const announce = jest.spyOn(
  AccessibilityInfo,
  "announceForAccessibilityWithOptions"
)

// Jest's TextInput mock shares one focus mock between instances.
afterEach(() => jest.clearAllMocks())

const tick = () => act(() => new Promise((resolve) => setTimeout(resolve)))
const props = (testID: string) => screen.getByTestId(testID).props

describe("Field", () => {
  test("the label names the control, and the description and a showing error describe it", async () => {
    await render(
      <Field invalid>
        <FieldLabel>Email</FieldLabel>
        <Input testID="email" />
        <FieldDescription>We never share it.</FieldDescription>
        <FieldError>Enter an email.</FieldError>
      </Field>
    )
    await tick()
    expect(props("email").accessibilityLabel).toBe("Email")
    expect(props("email").accessibilityHint).toBe(
      "We never share it. Enter an email."
    )
  })

  test("pressing the label starts editing a text field and presses a switch", async () => {
    const onCheckedChange = jest.fn()
    const ref = createRef<TextInputInstance>()
    await render(
      <>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input ref={ref} />
        </Field>
        <Field>
          <FieldLabel>Notifications</FieldLabel>
          <Switch testID="switch" onCheckedChange={onCheckedChange} />
        </Field>
      </>
    )
    await tick()
    await fireEvent.press(screen.getByText("Email"))
    expect(ref.current!.focus).toHaveBeenCalledTimes(1)
    await fireEvent.press(screen.getByText("Notifications"))
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    expect(onCheckedChange.mock.calls[0][0]).toBe(true)
  })

  test("a disabled field disables its control and its label presses nothing", async () => {
    const onCheckedChange = jest.fn()
    await render(
      <Field disabled>
        <FieldLabel>Notifications</FieldLabel>
        <Switch testID="switch" onCheckedChange={onCheckedChange} />
      </Field>
    )
    await tick()
    expect(props("switch").accessibilityState).toMatchObject({
      disabled: true,
    })
    await fireEvent.press(screen.getByText("Notifications"))
    await fireEvent.press(screen.getByTestId("switch"))
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test("an error is announced when it appears or changes, and not on the first render", async () => {
    function Form() {
      const [error, setError] = useState<string | undefined>("Required.")
      return (
        <Field invalid={!!error}>
          <FieldLabel>Name</FieldLabel>
          <Input testID="name" />
          <FieldError>{error}</FieldError>
          <Pressable testID="none" onPress={() => setError(undefined)} />
          <Pressable testID="short" onPress={() => setError("Too short.")} />
          <Pressable testID="long" onPress={() => setError("Too long.")} />
        </Field>
      )
    }
    await render(<Form />)
    await tick()
    expect(announce).not.toHaveBeenCalled()
    await fireEvent.press(screen.getByTestId("short"))
    await tick()
    expect(announce).toHaveBeenLastCalledWith("Too short.", { queue: true })
    await fireEvent.press(screen.getByTestId("none"))
    await tick()
    expect(screen.queryByText("Too short.")).toBeNull()
    await fireEvent.press(screen.getByTestId("long"))
    await tick()
    expect(announce).toHaveBeenLastCalledWith("Too long.", { queue: true })
    expect(announce).toHaveBeenCalledTimes(2)
  })

  test("an error with match shows whatever invalid is, and match={false} hides it", async () => {
    await render(
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input />
        <FieldError match>Always</FieldError>
        <FieldError match={false}>Never</FieldError>
        <FieldError>Only when invalid</FieldError>
      </Field>
    )
    expect(screen.getByText("Always")).toBeTruthy()
    expect(screen.queryByText("Never")).toBeNull()
    expect(screen.queryByText("Only when invalid")).toBeNull()
  })

  test("parts outside a field are plain text", async () => {
    await render(
      <>
        <FieldLabel testID="label">Alone</FieldLabel>
        <FieldError match>Shown</FieldError>
        <FieldError>Hidden</FieldError>
      </>
    )
    expect(screen.getByText("Alone")).toBeTruthy()
    expect(screen.getByText("Shown")).toBeTruthy()
    expect(screen.queryByText("Hidden")).toBeNull()
  })
  test("a checkbox takes the field nearest to it, and a field around its group names none of the group's checkboxes", async () => {
    const onValueChange = jest.fn()
    await render(
      <Field>
        <FieldLabel>Notifications</FieldLabel>
        <CheckboxGroup onValueChange={onValueChange}>
          <Field>
            <Checkbox testID="email" value="email" />
            <FieldLabel>Email</FieldLabel>
          </Field>
          <Checkbox testID="sms" value="sms" aria-label="Text message" />
        </CheckboxGroup>
      </Field>
    )
    await tick()
    expect(props("email").accessibilityLabel).toBe("Email")
    expect(props("sms").accessibilityLabel).toBe("Text message")
    await fireEvent.press(screen.getByText("Email"))
    expect(onValueChange.mock.lastCall?.[0]).toEqual(["email"])
    await fireEvent.press(screen.getByText("Notifications"))
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  test("changing disabled keeps an input's hooks in order", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {})
    const { rerender } = await render(<Input aria-label="Name" />)
    await rerender(<Input aria-label="Name" disabled />)
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  test("a FieldControl sends its disabled state explicitly, so Android enables it again", async () => {
    const view = (disabled: boolean) => (
      <Field disabled={disabled}>
        <FieldLabel>Code</FieldLabel>
        <FieldControl testID="code" />
      </Field>
    )
    const { rerender } = await render(view(true))
    await tick()
    expect(props("code").editable).toBe(false)
    expect(props("code").accessibilityState.disabled).toBe(true)
    await rerender(view(false))
    expect(props("code").editable).toBe(true)
    expect(props("code").accessibilityState.disabled).toBe(false)
    expect(props("code").accessibilityLabel).toBe("Code")
  })
})

describe("FieldSet", () => {
  test("a disabled field set around another disables the controls inside both", async () => {
    const onCheckedChange = jest.fn()
    function Settings() {
      const [disabled, setDisabled] = useState(true)
      return (
        <>
          <Pressable testID="enable" onPress={() => setDisabled(false)} />
          <FieldSet disabled={disabled}>
            <FieldLegend>Account</FieldLegend>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input testID="email" />
            </Field>
            <FieldSet>
              <FieldLegend>Alerts</FieldLegend>
              <Switch testID="switch" onCheckedChange={onCheckedChange} />
              <Checkbox testID="checkbox" aria-label="Weekly" />
            </FieldSet>
          </FieldSet>
        </>
      )
    }
    await render(<Settings />)
    await tick()
    expect(props("email").editable).toBe(false)
    expect(props("switch").accessibilityState).toMatchObject({
      disabled: true,
    })
    expect(props("checkbox").accessibilityState).toMatchObject({
      disabled: true,
    })
    await fireEvent.press(screen.getByTestId("switch"))
    expect(onCheckedChange).not.toHaveBeenCalled()

    await fireEvent.press(screen.getByTestId("enable"))
    expect(props("email").editable).toBe(true)
    // Android keeps a text field disabled when the state is only removed.
    expect(props("email").accessibilityState.disabled).toBe(false)
    await fireEvent.press(screen.getByTestId("switch"))
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
  })

  test("a field set's legend gives the set no label, since it holds the controls", async () => {
    await render(
      <FieldSet testID="set">
        <FieldLegend>Account</FieldLegend>
        <Text>Inside</Text>
      </FieldSet>
    )
    expect(props("set").accessibilityLabel).toBeUndefined()
    expect(screen.getByText("Inside")).toBeTruthy()
  })
})
