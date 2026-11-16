import { fireEvent, render, screen } from "@testing-library/react-native"
import { I18nManager, View } from "react-native"
import { Field, FieldLabel } from "../src/field"
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
  SliderValue,
  type SliderOptions,
} from "../src/slider"

const hidden = { includeHiddenElements: true }

// Jest's views don't lay out: every view spans x 0 to 100.
beforeAll(() => {
  Object.assign(View.prototype, {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 20 }),
  })
})

afterEach(() => jest.restoreAllMocks())

function Volume(props: SliderOptions<number | number[]>) {
  const range = Array.isArray(props.defaultValue ?? props.value)
  return (
    <Slider {...props}>
      <SliderValue testID="value" />
      <SliderControl testID="control">
        <SliderTrack>
          <SliderIndicator testID="indicator" />
          <SliderThumb aria-label={range ? "Minimum" : "Volume"} />
          {range && <SliderThumb index={1} aria-label="Maximum" />}
        </SliderTrack>
      </SliderControl>
    </Slider>
  )
}

const thumb = (name = "Volume") => screen.getByLabelText(name)
const at = (x: number) => ({ nativeEvent: { pageX: x, pageY: 10 } })

async function drag(...xs: number[]) {
  const control = screen.getByTestId("control")
  const [first, ...rest] = xs
  expect(control.props.onStartShouldSetResponder()).toBe(true)
  await fireEvent(control, "responderGrant", at(first))
  for (const x of rest) {
    await fireEvent(control, "responderMove", at(x))
  }
  return control
}

describe("Slider", () => {
  test("each thumb is one adjustable element with its value", async () => {
    await render(<Volume defaultValue={40} />)
    expect(thumb().props.accessibilityRole).toBe("adjustable")
    expect(thumb().props.accessible).toBe(true)
    expect(thumb().props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 40,
      text: "40",
    })
  })

  test("a range's thumbs end at their neighbours", async () => {
    await render(<Volume defaultValue={[20, 80]} />)
    expect(thumb("Minimum").props.accessibilityValue).toMatchObject({
      min: 0,
      max: 80,
      now: 20,
    })
    expect(thumb("Maximum").props.accessibilityValue).toMatchObject({
      min: 20,
      max: 100,
      now: 80,
    })
  })

  test("a field's label names each thumb", async () => {
    await render(
      <Field>
        <FieldLabel>Price</FieldLabel>
        <Slider defaultValue={[20, 80]}>
          <SliderControl>
            <SliderThumb />
            <SliderThumb index={1} />
          </SliderControl>
        </Slider>
      </Field>
    )
    const thumbs = screen.getAllByLabelText("Price")
    expect(thumbs.map((thumb) => thumb.props.accessibilityValue.now)).toEqual([
      20, 80,
    ])
  })

  test("shows the formatted value, which screen readers hear from the thumbs only", async () => {
    await render(<Volume defaultValue={[20, 80]} />)
    expect(screen.getByTestId("value", hidden).props.children).toBe("20 – 80")
    expect(screen.queryByText("20 – 80")).toBeNull()
  })

  test("a touch drag moves the thumb and commits once when it lifts", async () => {
    const onValueChange = jest.fn()
    const onValueCommit = jest.fn()
    await render(
      <Volume
        defaultValue={10}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />
    )
    const control = await drag(30, 60)
    expect(thumb().props.accessibilityValue.now).toBe(60)
    expect(onValueChange).toHaveBeenLastCalledWith(
      60,
      expect.objectContaining({ reason: "drag", source: "touch" })
    )
    expect(onValueCommit).not.toHaveBeenCalled()
    await fireEvent(control, "responderRelease", at(60))
    expect(onValueCommit).toHaveBeenCalledTimes(1)
    expect(onValueCommit).toHaveBeenCalledWith(
      60,
      expect.objectContaining({ reason: "drag" })
    )
  })

  test("a cancelled responder puts the value back and commits nothing", async () => {
    const onValueCommit = jest.fn()
    await render(<Volume defaultValue={10} onValueCommit={onValueCommit} />)
    const control = await drag(30, 60)
    await fireEvent(control, "responderTerminate", at(60))
    expect(thumb().props.accessibilityValue.now).toBe(10)
    expect(onValueCommit).not.toHaveBeenCalled()
  })

  test("a drag keeps the responder from a scroll view that asks for it", async () => {
    await render(<Volume />)
    const control = screen.getByTestId("control")
    expect(control.props.onResponderTerminationRequest()).toBe(false)
  })

  test("unmounting mid-drag commits nothing", async () => {
    const onValueCommit = jest.fn()
    const { unmount } = await render(
      <Volume defaultValue={10} onValueCommit={onValueCommit} />
    )
    await drag(30, 60)
    await unmount()
    expect(onValueCommit).not.toHaveBeenCalled()
  })

  test("right to left, the track starts on the right, following the host", async () => {
    jest.replaceProperty(I18nManager, "isRTL", true)
    await render(<Volume />)
    await drag(20)
    expect(thumb().props.accessibilityValue.now).toBe(80)
  })

  test("a disabled or read-only slider takes no touch", async () => {
    const { rerender } = await render(<Volume disabled />)
    const control = () => screen.getByTestId("control")
    expect(control().props.onStartShouldSetResponder()).toBe(false)
    await rerender(<Volume readOnly />)
    expect(control().props.onStartShouldSetResponder()).toBe(false)
  })

  test("increment and decrement step the thumb, as a screen reader's swipe", async () => {
    const onValueCommit = jest.fn()
    await render(
      <Volume defaultValue={50} step={5} onValueCommit={onValueCommit} />
    )
    expect(thumb().props.accessibilityActions).toEqual([
      { name: "increment" },
      { name: "decrement" },
    ])
    await fireEvent(thumb(), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    })
    expect(thumb().props.accessibilityValue.now).toBe(55)
    await fireEvent(thumb(), "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    })
    expect(thumb().props.accessibilityValue.now).toBe(50)
    expect(onValueCommit).toHaveBeenLastCalledWith(
      50,
      expect.objectContaining({
        reason: "accessibility-adjust",
        source: "virtual",
      })
    )
  })

  test("the thumb sits on its value, and the indicator fills up to it", async () => {
    await render(<Volume defaultValue={[20, 80]} />)
    expect(screen.getByTestId("indicator").props.style).toEqual(
      expect.objectContaining({ start: "20%", width: "60%" })
    )
  })

  test("a disabled slider's thumbs say so", async () => {
    await render(<Volume disabled />)
    expect(thumb().props.accessibilityState).toMatchObject({ disabled: true })
  })

  test("a value formatted as nothing sends an empty text, which Android needs to clear the old one", async () => {
    await render(<Volume format={() => ""} />)
    expect(thumb().props.accessibilityValue.text).toBe("")
  })
})
