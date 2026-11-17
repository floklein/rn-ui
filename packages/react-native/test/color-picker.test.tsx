import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { I18nManager, View } from "react-native"
import { checkPattern } from "../src/check-pattern"
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerAreaCanvas,
  ColorPickerAreaThumb,
  ColorPickerChannelInput,
  ColorPickerInput,
  type ColorPickerOptions,
  ColorPickerSlider,
  ColorPickerSliderThumb,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerSwatchItem,
  createColorPickerController,
} from "../src/color-picker"
import { Field, FieldSet } from "../src/field"

// Jest's views don't lay out: every view spans 0 to 100 on both axes.
beforeAll(() => {
  Object.assign(View.prototype, {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  })
})

afterEach(() => jest.restoreAllMocks())

function Picker(props: ColorPickerOptions) {
  return (
    <ColorPicker aria-label="Brand" {...props}>
      <ColorPickerArea testID="area">
        <ColorPickerAreaThumb testID="area-thumb" />
      </ColorPickerArea>
      <ColorPickerSlider testID="hue" channel="hue">
        <ColorPickerSliderThumb testID="hue-thumb" />
      </ColorPickerSlider>
      <ColorPickerSlider testID="alpha" channel="alpha" orientation="vertical">
        <ColorPickerSliderThumb />
      </ColorPickerSlider>
      <ColorPickerInput testID="input" aria-label="Hex" />
      <ColorPickerChannelInput testID="red" channel="red" />
      <ColorPickerSwatch testID="swatch" />
      <ColorPickerSwatches>
        <ColorPickerSwatchItem testID="preset" value="#0ea5e9" />
      </ColorPickerSwatches>
    </ColorPicker>
  )
}

const hidden = { includeHiddenElements: true }
const value = () =>
  screen.getByTestId("area-thumb").props.accessibilityValue.text

const at = (x: number, y: number) => ({ nativeEvent: { pageX: x, pageY: y } })

async function drag(testID: string, ...points: [number, number][]) {
  const view = screen.getByTestId(testID)
  const [first, ...rest] = points
  expect(view.props.onStartShouldSetResponder()).toBe(true)
  await fireEvent(view, "responderGrant", at(...first))
  for (const point of rest) {
    await fireEvent(view, "responderMove", at(...point))
  }
  return view
}

describe("ColorPicker", () => {
  test("a touch drag on the area moves the color and commits once when it lifts", async () => {
    const onValueChange = jest.fn()
    const onValueCommit = jest.fn()
    await render(
      <Picker
        defaultValue="#000000"
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />
    )
    const area = await drag("area", [10, 90], [100, 0])
    expect(onValueChange).toHaveBeenLastCalledWith(
      "#ff0000",
      expect.objectContaining({ reason: "drag", source: "touch" })
    )
    expect(onValueCommit).not.toHaveBeenCalled()
    await fireEvent(area, "responderRelease", at(100, 0))
    expect(onValueCommit).toHaveBeenCalledTimes(1)
    expect(onValueCommit).toHaveBeenCalledWith(
      "#ff0000",
      expect.objectContaining({ reason: "drag" })
    )
  })

  test("a cancelled responder puts the color back and commits nothing", async () => {
    const onValueCommit = jest.fn()
    await render(
      <Picker defaultValue="#000000" onValueCommit={onValueCommit} />
    )
    const area = await drag("area", [100, 0])
    expect(value()).toBe("Saturation 100%, Brightness 100%")
    await fireEvent(area, "responderTerminate", at(100, 0))
    expect(value()).toBe("Saturation 0%, Brightness 0%")
    expect(onValueCommit).not.toHaveBeenCalled()
  })

  test("a press on a slider jumps its channel there; a vertical one grows upward", async () => {
    const onValueCommit = jest.fn()
    await render(
      <Picker defaultValue="#ff0000" onValueCommit={onValueCommit} />
    )
    const hue = await drag("hue", [50, 50])
    await fireEvent(hue, "responderRelease", at(50, 50))
    expect(onValueCommit).toHaveBeenLastCalledWith(
      "#00ffff",
      expect.objectContaining({ reason: "track-press" })
    )
    const alpha = await drag("alpha", [50, 75])
    await fireEvent(alpha, "responderRelease", at(50, 75))
    expect(onValueCommit).toHaveBeenLastCalledWith(
      "#00ffff40",
      expect.objectContaining({ reason: "track-press" })
    )
  })

  test("right to left, the area and a horizontal slider start on the right", async () => {
    jest.replaceProperty(I18nManager, "isRTL", true)
    await render(<Picker defaultValue="#000000" />)
    await drag("area", [0, 0])
    expect(value()).toBe("Saturation 100%, Brightness 100%")
  })

  test("a disabled or read-only picker takes no touch and no step", async () => {
    const onValueChange = jest.fn()
    const { rerender } = await render(
      <Picker defaultValue="#000000" disabled onValueChange={onValueChange} />
    )
    expect(screen.getByTestId("area").props.onStartShouldSetResponder()).toBe(
      false
    )
    await rerender(
      <Picker defaultValue="#000000" readOnly onValueChange={onValueChange} />
    )
    expect(screen.getByTestId("hue").props.onStartShouldSetResponder()).toBe(
      false
    )
    await fireEvent(screen.getByTestId("hue-thumb"), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test("increment and decrement step a thumb and commit, as the web's arrow keys", async () => {
    const onValueCommit = jest.fn()
    await render(
      <Picker defaultValue="#ffffff" onValueCommit={onValueCommit} />
    )
    const thumb = screen.getByTestId("area-thumb")
    expect(thumb.props.accessibilityRole).toBe("adjustable")
    expect(thumb.props.accessibilityActions).toEqual([
      { name: "increment" },
      { name: "decrement" },
    ])
    await fireEvent(thumb, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    })
    expect(value()).toBe("Saturation 1%, Brightness 100%")
    expect(onValueCommit).toHaveBeenCalledWith(
      "#fffcfc",
      expect.objectContaining({ reason: "step-key", source: "virtual" })
    )
    await fireEvent(screen.getByTestId("hue-thumb"), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    })
    expect(
      screen.getByTestId("hue-thumb").props.accessibilityValue
    ).toMatchObject({ now: 1, text: "1 degrees" })
  })

  test("the text field reads a color when editing ends, and text that isn't one goes back", async () => {
    const onValueCommit = jest.fn()
    await render(
      <Picker defaultValue="#000000" onValueCommit={onValueCommit} />
    )
    const input = screen.getByTestId("input")
    await fireEvent.changeText(input, "rebeccapurple")
    expect(screen.getByTestId("input").props.value).toBe("rebeccapurple")
    await fireEvent(input, "submitEditing")
    expect(screen.getByTestId("input").props.value).toBe("#663399")
    expect(onValueCommit).toHaveBeenCalledWith(
      "#663399",
      expect.objectContaining({ reason: "input-commit", source: "keyboard" })
    )
    await fireEvent.changeText(input, "nope")
    await fireEvent(input, "blur")
    expect(screen.getByTestId("input").props.value).toBe("#663399")
  })

  test("a channel field sets its channel in its own units when editing ends", async () => {
    await render(<Picker space="srgb" format="hex" defaultValue="#000000" />)
    const red = screen.getByTestId("red")
    expect(red.props.value).toBe("0")
    expect(red.props.accessibilityLabel).toBe("Red")
    await fireEvent.changeText(red, "255")
    expect(screen.getByTestId("input").props.value).toBe("#000000")
    await fireEvent(red, "submitEditing")
    expect(screen.getByTestId("input").props.value).toBe("#ff0000")
    expect(screen.getByTestId("red").props.value).toBe("255")
  })

  test("a channel field left empty keeps the channel", async () => {
    await render(<Picker space="srgb" format="hex" defaultValue="#ff0000" />)
    await fireEvent.changeText(screen.getByTestId("red"), " ")
    await fireEvent(screen.getByTestId("red"), "blur")
    expect(screen.getByTestId("input").props.value).toBe("#ff0000")
    expect(screen.getByTestId("red").props.value).toBe("255")
  })

  test("a slider unmounting mid-drag leaves the area's drag alone", async () => {
    const onValueCommit = jest.fn()
    function Toggled({ alpha }: { alpha: boolean }) {
      return (
        <ColorPicker defaultValue="#000000" onValueCommit={onValueCommit}>
          <ColorPickerArea testID="area">
            <ColorPickerAreaThumb testID="area-thumb" />
          </ColorPickerArea>
          {alpha && (
            <ColorPickerSlider channel="alpha">
              <ColorPickerSliderThumb />
            </ColorPickerSlider>
          )}
        </ColorPicker>
      )
    }
    const { rerender } = await render(<Toggled alpha />)
    const area = await drag("area", [100, 0])
    await rerender(<Toggled alpha={false} />)
    await fireEvent(area, "responderRelease", at(100, 0))
    expect(value()).toBe("Saturation 100%, Brightness 100%")
    expect(onValueCommit).toHaveBeenCalledWith(
      "#ff0000",
      expect.objectContaining({ reason: "track-press" })
    )
  })

  test("a swatch item is a button, selected when it is the color, and a press picks it", async () => {
    const onValueCommit = jest.fn()
    await render(
      <Picker defaultValue="#000000" onValueCommit={onValueCommit} />
    )
    const preset = () => screen.getByTestId("preset")
    expect(preset().props.accessibilityRole).toBe("button")
    expect(preset().props.accessibilityState).toMatchObject({ selected: false })
    await fireEvent.press(preset())
    expect(onValueCommit).toHaveBeenCalledWith(
      "#0ea5e9",
      expect.objectContaining({ reason: "item-press" })
    )
    expect(preset().props.accessibilityState).toMatchObject({ selected: true })
  })

  test("state carries the colors and places the web writes as CSS variables", async () => {
    const seen: Record<string, unknown> = {}
    await render(
      <ColorPicker
        defaultValue="#ff0000"
        style={(state) => void (seen.root = state.displayColor)}
      >
        <ColorPickerArea
          style={(state) => void (seen.area = state.areaBackground)}
        >
          <ColorPickerAreaThumb
            aria-label="Color"
            style={(state) => void (seen.thumb = [state.areaX, state.areaY])}
          />
        </ColorPickerArea>
        <ColorPickerSlider
          channel="alpha"
          style={(state) => void (seen.slider = state.sliderBackground)}
        >
          <ColorPickerSliderThumb
            style={(state) => void (seen.position = state.sliderThumbPosition)}
          />
        </ColorPickerSlider>
        <ColorPickerSwatch
          style={(state) => void (seen.swatch = state.displayColor)}
        />
      </ColorPicker>
    )
    expect(seen).toEqual({
      root: "#ff0000",
      area: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(0 100% 50%))",
      thumb: [1, 1],
      slider: "linear-gradient(to right, #ff000000, #ff0000)",
      position: 100,
      swatch: "#ff0000",
    })
  })

  test("the canvas paints an OKLCH area as rows, with colors outside sRGB clear", async () => {
    await render(
      <ColorPicker space="oklch" defaultValue="oklch(0.62 0.19 259)">
        <ColorPickerArea>
          <ColorPickerAreaCanvas testID="canvas" rows={3} columns={2} />
        </ColorPickerArea>
      </ColorPicker>
    )
    const rows = screen.getByTestId("canvas", hidden).props.children
    expect(rows).toHaveLength(3)
    const lines = rows.map(
      (row: { props: { style: { backgroundImage: string } } }) =>
        row.props.style.backgroundImage
    )
    expect(lines[0]).toMatch(
      /^linear-gradient\(to right, #ffffff, #[0-9a-f]{6}00\)$/
    )
    expect(lines[2]).toMatch(
      /^linear-gradient\(to right, #000000, #[0-9a-f]{6}00\)$/
    )
  })

  test("a controller's focus() asks for the area's thumb", async () => {
    const controller = createColorPickerController()
    const sent = jest.spyOn(
      require("react-native").AccessibilityInfo,
      "sendAccessibilityEvent"
    )
    await render(<Picker defaultValue="#000000" controller={controller} />)
    await act(() => controller.focus())
    expect(sent).toHaveBeenCalledWith(expect.anything(), "focus")
  })

  test("a disabled fieldset disables the picker's fields", async () => {
    await render(
      <FieldSet disabled>
        <Field>
          <Picker defaultValue="#000000" />
        </Field>
      </FieldSet>
    )
    expect(screen.getByTestId("input").props.editable).toBe(false)
    expect(screen.getByTestId("area").props.onStartShouldSetResponder()).toBe(
      false
    )
  })

  test.each(["ios", "android"] as const)(
    "passes the slider pattern on %s",
    async (os) => {
      await render(<Picker defaultValue="#336699" />)
      await expect(
        checkPattern(screen.container, "slider", { os, act })
      ).resolves.toBeUndefined()
    }
  )
})
