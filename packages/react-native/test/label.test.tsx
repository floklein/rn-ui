import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import { AccessibilityInfo, type TextInputInstance } from "react-native"
import { Checkbox } from "../src/checkbox"
import { Field, FieldLabel } from "../src/field"
import { Input } from "../src/input"
import { Label } from "../src/label"
import { Slider, SliderThumb } from "../src/slider"
import { Switch } from "../src/switch"

// Jest's TextInput mock shares one focus mock between instances.
afterEach(() => jest.clearAllMocks())

const tick = () => act(() => new Promise((resolve) => setTimeout(resolve)))
const props = (testID: string) => screen.getByTestId(testID).props

describe("Label", () => {
  test("a label for a switch names it, and pressing the label presses it", async () => {
    const onCheckedChange = jest.fn()
    await render(
      <>
        <Switch
          id="updates"
          testID="switch"
          onCheckedChange={onCheckedChange}
        />
        <Label htmlFor="updates">Email me product updates</Label>
      </>
    )
    await tick()
    expect(props("switch").accessibilityLabel).toBe("Email me product updates")
    await fireEvent.press(screen.getByText("Email me product updates"))
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    expect(onCheckedChange.mock.calls[0][0]).toBe(true)
  })

  test("a label for a text field names it and starts editing it, unless it's disabled", async () => {
    const ref = createRef<TextInputInstance>()
    const disabled = createRef<TextInputInstance>()
    await render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" testID="email" ref={ref} />
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" ref={disabled} disabled />
      </>
    )
    await tick()
    expect(props("email").accessibilityLabel).toBe("Email")
    await fireEvent.press(screen.getByText("Email"))
    expect(ref.current!.focus).toHaveBeenCalledTimes(1)
    jest.clearAllMocks()
    await fireEvent.press(screen.getByText("Phone"))
    expect(disabled.current!.focus).not.toHaveBeenCalled()
  })

  test("a label for a slider names each thumb without a name of its own, and focuses the slider", async () => {
    await render(
      <>
        <Label htmlFor="volume">Volume</Label>
        <Slider id="volume" defaultValue={75}>
          <SliderThumb />
        </Slider>
        <Label htmlFor="price">Price</Label>
        <Slider id="price" defaultValue={[20, 80]}>
          <SliderThumb />
          <SliderThumb index={1} aria-label="Maximum" />
        </Slider>
      </>
    )
    await tick()
    expect(screen.getByLabelText("Volume").props.accessibilityValue.now).toBe(
      75
    )
    expect(screen.getByLabelText("Price").props.accessibilityValue.now).toBe(20)
    await fireEvent.press(screen.getByText("Volume"))
    expect(AccessibilityInfo.sendAccessibilityEvent).toHaveBeenCalledTimes(1)
    const [view, event] = jest.mocked(AccessibilityInfo.sendAccessibilityEvent)
      .mock.calls[0]
    expect(
      (view as unknown as { props: { accessibilityLabel: string } }).props
        .accessibilityLabel
    ).toBe("Volume")
    expect(event).toBe("focus")
  })

  test("a press on a disabled slider's label leaves focus where it is", async () => {
    await render(
      <>
        <Label htmlFor="volume">Volume</Label>
        <Slider id="volume" defaultValue={75} disabled>
          <SliderThumb />
        </Slider>
      </>
    )
    await tick()
    await fireEvent.press(screen.getByText("Volume"))
    expect(AccessibilityInfo.sendAccessibilityEvent).not.toHaveBeenCalled()
  })

  test("a control's own name wins, and so does its field's label", async () => {
    await render(
      <>
        <Checkbox id="terms" testID="terms" aria-label="Accept the terms" />
        <Label htmlFor="terms">Terms</Label>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input id="name" testID="name" />
        </Field>
        <Label htmlFor="name">Full name</Label>
      </>
    )
    await tick()
    expect(props("terms").accessibilityLabel).toBe("Accept the terms")
    expect(props("name").accessibilityLabel).toBe("Name")
  })

  test("the label mounted last names the control, and once it unmounts the one before does again", async () => {
    function Screen({ second }: { second: boolean }) {
      return (
        <>
          <Label htmlFor="news">Newsletter</Label>
          {second && <Label htmlFor="news">Weekly digest</Label>}
          <Switch id="news" testID="news" />
        </>
      )
    }
    const { rerender } = await render(<Screen second />)
    await tick()
    expect(props("news").accessibilityLabel).toBe("Weekly digest")
    await rerender(<Screen second={false} />)
    await tick()
    expect(props("news").accessibilityLabel).toBe("Newsletter")
  })

  test("once a later control with the same id unmounts, the label presses the earlier one again", async () => {
    const onCheckedChange = jest.fn()
    function Stack({ top }: { top: boolean }) {
      return (
        <>
          <Switch id="news" onCheckedChange={onCheckedChange} />
          <Label htmlFor="news">News</Label>
          {top && <Switch id="news" />}
        </>
      )
    }
    const { rerender } = await render(<Stack top />)
    await tick()
    await rerender(<Stack top={false} />)
    await tick()
    await fireEvent.press(screen.getByText("News"))
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
  })

  test("a label for no control is plain text a press does nothing on", async () => {
    await render(<Label htmlFor="nothing">Alone</Label>)
    await fireEvent.press(screen.getByText("Alone"))
    expect(screen.getByText("Alone").props.accessibilityLabel).toBeUndefined()
  })
})
