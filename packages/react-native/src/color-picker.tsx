import {
  colorPicker,
  type ColorPickerAreaProps,
  type ColorPickerChannelInputProps,
  type ColorPickerOptions,
  type ColorPickerPrimitive,
  type ColorPickerSliderProps,
  type ColorPickerSliderState,
  type ColorPickerState,
  type ColorPickerSwatchItemProps,
  type ColorPickerSwatchItemState,
} from "@ui-sdk/core/color-picker"
import { parseColor } from "@ui-sdk/core/color"
import { colorPickerNative, nativeColorPicker } from "@ui-sdk/core/native"
import { partState, withSource } from "@ui-sdk/core/renderer"
import * as React from "react"
import { Pressable, StyleSheet, TextInput, View } from "react-native"
import { useInheritedDisabled } from "./field-context"
import { mergeProps, withState } from "./render-element"
import {
  createParts,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  useAround,
  useHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

type ColorPickerParts = Parts<
  ColorPickerPrimitive,
  {
    area: typeof View
    "area-thumb": typeof View
    slider: typeof View
    "slider-thumb": typeof View
    swatch: typeof View
    swatches: typeof View
    "swatch-item": typeof Pressable
  }
>

const parts: ColorPickerParts = createParts(colorPicker, {
  area: View,
  "area-thumb": View,
  slider: View,
  "slider-thumb": View,
  swatch: View,
  swatches: View,
  "swatch-item": Pressable,
})

/**
 * The state `ColorPicker` and `ColorPickerSwatch` hand their style, class
 * name, children and `render`: the picker's, with the color React Native
 * draws, the web's `--color-picker-color`.
 * @experimental
 */
type ColorPickerSwatchState = ColorPickerState & {
  /** The color the parts show, fit into sRGB and written in hex, for `backgroundColor`. */
  displayColor: string
}

/**
 * The state `ColorPickerArea` hands its style, class name, children and `render`.
 * @experimental
 */
type ColorPickerAreaState = ColorPickerState & {
  /** The area's background, for `backgroundImage`, where two gradients draw it: saturation by brightness or lightness. Otherwise undefined, and a `ColorPickerAreaCanvas` draws it. */
  areaBackground: string | undefined
}

/**
 * The state `ColorPickerAreaThumb` hands its style, class name, children and `render`.
 * @experimental
 */
type ColorPickerAreaThumbState = ColorPickerSwatchState & {
  /** Where the thumb sits across the area, from 0 to 1. */
  areaX: number
  /** Where the thumb sits up the area, from 0 at the bottom to 1. */
  areaY: number
}

/**
 * The state `ColorPickerSlider` hands its style, class name, children and `render`.
 * @experimental
 */
type ColorPickerSliderTrackState = ColorPickerSliderState & {
  /** The track's background, for `backgroundImage`: the color as the channel runs from its start to its end. */
  sliderBackground: string
}

/**
 * The state `ColorPickerSliderThumb` hands its style, class name, children and `render`.
 * @experimental
 */
type ColorPickerSliderThumbState = ColorPickerSliderState & {
  /** Where the thumb sits along the track, from 0 to 100. */
  sliderThumbPosition: number
}

/**
 * The state `ColorPickerSwatchItem` hands its style, class name, children and `render`.
 * @experimental
 */
type ColorPickerSwatchItemDrawnState = ColorPickerSwatchItemState & {
  /** The swatch's own color, fit into sRGB and written in hex, for `backgroundColor`. */
  displayColor: string
}

type Picker = ReturnType<typeof nativeColorPicker>

// What the parts written here read of the instance's state as they render.
type Held = Pick<ColorPickerState, "color" | "space" | "value" | "readOnly"> & {
  disabled: boolean
  formDisabled: boolean
  text: string | null
}

const held = (handle: { state: unknown }) => handle.state as Held

const painters = new WeakMap<object, Picker>()

function painterOf(api: PrimitiveHandle<ColorPickerPrimitive>["api"]) {
  let painter = painters.get(api)
  if (!painter) {
    painter = nativeColorPicker(api)
    painters.set(api, painter)
  }
  return painter
}

const usePainter = () => painterOf(useHandle(colorPicker).api)

const displayed = (painter: Picker) => (state: ColorPickerState) => ({
  displayColor: painter.color(state.color),
})

/**
 * The root: a group around the picker's parts. It takes part in no form, so
 * it has no hidden input and no `name`.
 * @experimental
 */
function ColorPicker({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  space,
  format,
  gamut,
  disabled,
  readOnly,
  required,
  controller,
  debug,
  ...props
}: Omit<ColorPickerOptions, "name" | "form"> &
  PartProps<typeof View, ColorPickerSwatchState>) {
  const handle = usePrimitive(
    colorPicker,
    {
      value,
      defaultValue,
      onValueChange,
      onValueCommit,
      space,
      format,
      gamut,
      disabled,
      readOnly,
      required,
      controller,
      debug,
    },
    colorPickerNative
  )
  const painter = painterOf(handle.api)
  return usePart(
    handle,
    "root",
    {},
    { ...props, ...withState(props, displayed(painter)) } as Record<
      string,
      unknown
    >,
    View
  )
}

/**
 * A surface for two channels, `x` and `y`: a touch moves the color there, and
 * a drag follows it. Its state's `areaBackground` draws it where gradients
 * can, and a `ColorPickerAreaCanvas` elsewhere.
 * @experimental
 */
function ColorPickerArea({
  x,
  y,
  ...props
}: PartProps<typeof View, ColorPickerAreaState> & ColorPickerAreaProps) {
  const painter = usePainter()
  return (
    <parts.Area
      x={x}
      y={y}
      {...props}
      {...withState<ColorPickerState, { areaBackground: string | undefined }>(
        props,
        (state) => ({ areaBackground: painter.areaBackground(state, { x, y }) })
      )}
    />
  )
}

// A box as large as the area, centered on the thumb's place, centers the
// thumb on it in either direction without measuring the thumb.
function centeredOn(across: number, up: number) {
  const x = across * 100
  const y = (1 - up) * 100
  return {
    start: `${x - 50}%`,
    end: `${50 - x}%`,
    top: `${y - 50}%`,
    bottom: `${50 - y}%`,
  } as const
}

/**
 * The area's thumb, one adjustable element: a screen reader's increment and
 * decrement step its `x` channel, and its value names both channels, as the
 * web's slider role does.
 * @experimental
 */
function ColorPickerAreaThumb(
  props: PartProps<typeof View, ColorPickerAreaThumbState>
) {
  const painter = usePainter()
  const area = (useAround(colorPicker, "area") ?? {}) as ColorPickerAreaProps
  const handle = useHandle(colorPicker)
  const place = (state: Pick<Held, "color" | "space">) => {
    const { x, y } = painter.areaThumb(state, area)
    return { areaX: x, areaY: y, displayColor: painter.color(state.color) }
  }
  const thumb = usePart(
    colorPicker,
    "area-thumb",
    { x: area.x, y: area.y },
    mergeProps(
      { accessible: true },
      {
        ...props,
        ...withState<ColorPickerState, ReturnType<typeof place>>(props, place),
      }
    ) as Record<string, unknown>,
    View
  )
  const { areaX, areaY } = place(held(handle))
  return (
    <View
      pointerEvents="box-none"
      style={[styles.place, centeredOn(areaX, areaY)]}
    >
      {thumb}
    </View>
  )
}

/**
 * Paints the area for channels no gradient draws, like OKLCH's chroma by
 * lightness, as rows of gradients. Colors outside sRGB stay clear.
 * @experimental
 */
function ColorPickerAreaCanvas({
  rows = 48,
  columns = 24,
  style,
  ...props
}: Omit<PartProps<typeof View, ColorPickerState>, "children"> & {
  /**
   * How many horizontal gradients draw the area, top to bottom.
   * @defaultValue 48
   */
  rows?: number
  /**
   * How many colors each row's gradient goes through.
   * @defaultValue 24
   */
  columns?: number
}) {
  const painter = usePainter()
  const area = (useAround(colorPicker, "area") ?? {}) as ColorPickerAreaProps
  const handle = useHandle(colorPicker)
  const state = held(handle)
  const lines = painter.areaRows(state, area, rows, columns)
  const key = lines.join("|")
  const drawn = React.useMemo(
    () =>
      lines.map((line, row) => (
        <View key={row} style={{ flex: 1, backgroundImage: line }} />
      )),
    [key]
  )
  return usePart(
    colorPicker,
    "area-canvas",
    { x: area.x, y: area.y },
    mergeProps(
      { style: StyleSheet.absoluteFill, pointerEvents: "none" },
      { ...props, style, children: drawn }
    ) as Record<string, unknown>,
    View
  )
}

/**
 * A track for one `channel`: a touch moves the channel there, and a drag
 * follows it. Its state's `sliderBackground` draws it.
 * @experimental
 */
function ColorPickerSlider({
  channel,
  orientation,
  ...props
}: PartProps<typeof View, ColorPickerSliderTrackState> &
  ColorPickerSliderProps) {
  const painter = usePainter()
  return (
    <parts.Slider
      channel={channel}
      orientation={orientation}
      {...props}
      {...withState<ColorPickerSliderState, { sliderBackground: string }>(
        props,
        (state) => ({
          sliderBackground: painter.sliderBackground(state, {
            channel,
            orientation,
          }),
        })
      )}
    />
  )
}

/**
 * The slider's thumb, one adjustable element a screen reader steps.
 * @experimental
 */
function ColorPickerSliderThumb(
  props: PartProps<typeof View, ColorPickerSliderThumbState>
) {
  const slider = (useAround(colorPicker, "slider") ??
    {}) as ColorPickerSliderProps & { id?: string }
  const handle = useHandle(colorPicker)
  const slotProps = {
    id: slider.id,
    channel: slider.channel,
    orientation: slider.orientation,
  }
  const position = (state: ColorPickerSliderState) => {
    const max = handle.api.internal.channel(state.channel).max
    return {
      sliderThumbPosition: Math.round((state.channelValue / max) * 1e4) / 100,
    }
  }
  const thumb = usePart(
    colorPicker,
    "slider-thumb",
    slotProps,
    mergeProps(
      { accessible: true },
      {
        ...props,
        ...withState<ColorPickerSliderState, ReturnType<typeof position>>(
          props,
          position
        ),
      }
    ) as Record<string, unknown>,
    View
  )
  const state = partState(
    handle.instance.part("slider-thumb", slotProps),
    slotProps
  ) as ColorPickerSliderState
  const at = position(state).sliderThumbPosition
  const vertical = state.orientation === "vertical"
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.place,
        vertical
          ? { top: `${50 - at}%`, bottom: `${at - 50}%`, start: 0, end: 0 }
          : { start: `${at - 50}%`, end: `${50 - at}%`, top: 0, bottom: 0 },
      ]}
    >
      {thumb}
    </View>
  )
}

type InputProps = Omit<
  PartProps<typeof TextInput, ColorPickerState>,
  "value" | "defaultValue" | "editable" | "readOnly"
>

// Android keeps a TextInput disabled when its disabled state is left out, and
// enables a read-only one, which then takes typing, when it's false.
function editing(state: Held, inherited: boolean) {
  const editable =
    !state.disabled && !state.formDisabled && !state.readOnly && !inherited
  return { editable, accessibilityState: { disabled: !editable } }
}

/**
 * A text field that reads any CSS color when editing ends. Text that isn't
 * one goes back to the value.
 * @experimental
 */
function ColorPickerInput(props: InputProps) {
  const handle = useHandle(colorPicker)
  const inherited = useInheritedDisabled()
  const { api } = handle
  const state = held(handle)
  const commit = () => withSource("keyboard", () => api.internal.commitText())
  return usePart(
    colorPicker,
    "input",
    {},
    mergeProps(
      {
        value: state.text ?? state.value,
        autoCorrect: false,
        autoCapitalize: "none",
        onChangeText: (text: string) => api.internal.setText(text),
        onSubmitEditing: commit,
        onBlur: commit,
        ...editing(held(handle), inherited),
      },
      props
    ) as Record<string, unknown>,
    TextInput
  )
}

/**
 * A number field for one `channel`, in the units people read it in. It sets
 * the channel when editing ends.
 * @experimental
 */
function ColorPickerChannelInput({
  channel,
  ...props
}: InputProps & ColorPickerChannelInputProps) {
  const handle = useHandle(colorPicker)
  const inherited = useInheritedDisabled()
  const { api } = handle
  const id = React.useId()
  const [draft, setDraft] = React.useState<string | null>(null)
  const spec = api.internal.channel(channel)
  const decimals = spec.step < 1 ? String(spec.step).length - 2 : 0
  const shown = String(
    Number(api.internal.sliderValue(channel).toFixed(decimals))
  )
  const commit = () => {
    if (draft !== null) {
      withSource("keyboard", () =>
        api.internal.setChannelValue(
          channel,
          draft.trim() ? Number(draft.replace(",", ".")) : NaN,
          undefined as never
        )
      )
      setDraft(null)
    }
  }
  return usePart(
    colorPicker,
    "channel-input",
    { id, channel },
    mergeProps(
      {
        value: draft ?? shown,
        keyboardType: "decimal-pad",
        onChangeText: setDraft,
        onSubmitEditing: commit,
        onBlur: commit,
        ...editing(held(handle), inherited),
      },
      props
    ) as Record<string, unknown>,
    TextInput
  )
}

/**
 * The color itself, named for screen readers, like "dark vivid blue". Its
 * state's `displayColor` fills it.
 * @experimental
 */
function ColorPickerSwatch(
  props: PartProps<typeof View, ColorPickerSwatchState>
) {
  const painter = usePainter()
  return <parts.Swatch {...props} {...withState(props, displayed(painter))} />
}

/**
 * A list of preset colors, each its own button.
 * @experimental
 */
const ColorPickerSwatches: ColorPickerParts["Swatches"] = parts.Swatches

/**
 * A preset color, a button: pressing it sets the value. Its state's
 * `displayColor` fills it.
 * @experimental
 */
function ColorPickerSwatchItem({
  value,
  ...props
}: PartProps<typeof Pressable, ColorPickerSwatchItemDrawnState> &
  ColorPickerSwatchItemProps) {
  const painter = usePainter()
  const parsed = parseColor(value)
  const color = parsed ? painter.color(parsed) : value
  return (
    <parts.SwatchItem
      value={value}
      {...props}
      {...withState<ColorPickerSwatchItemState, { displayColor: string }>(
        props,
        () => ({ displayColor: color })
      )}
    />
  )
}

const styles = StyleSheet.create({
  place: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
})

export { createColorPickerController } from "@ui-sdk/core/color-picker"
export type {
  ColorPickerAreaState,
  ColorPickerAreaThumbState,
  ColorPickerSliderThumbState,
  ColorPickerSliderTrackState,
  ColorPickerSwatchItemDrawnState,
  ColorPickerSwatchState,
}
export type {
  Color,
  ColorChannel,
  ColorFormat,
  ColorGamut,
  ColorPickerApi,
  ColorPickerAreaProps,
  ColorPickerChangeOptions,
  ColorPickerChannelInputProps,
  ColorPickerController,
  ColorPickerOptions,
  ColorPickerPrimitive,
  ColorPickerSliderProps,
  ColorPickerSliderState,
  ColorPickerSpace,
  ColorPickerState,
  ColorPickerSwatchItemProps,
  ColorPickerSwatchItemState,
  ColorPickerValueChangeDetails,
  ColorPickerValueChangeReason,
  ColorPickerValueCommitDetails,
} from "@ui-sdk/core/color-picker"

export {
  ColorPicker,
  ColorPickerArea,
  ColorPickerAreaCanvas,
  ColorPickerAreaThumb,
  ColorPickerChannelInput,
  ColorPickerInput,
  ColorPickerSlider,
  ColorPickerSliderThumb,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerSwatchItem,
}
