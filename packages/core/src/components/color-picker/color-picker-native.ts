import { convertColor, type Color } from "../../foundation/color/convert"
import { formatColor } from "../../foundation/color/format"
import { isDisabled } from "../../foundation/forms/form"
import { nativeElement } from "../../foundation/kernel/native-element"
import {
  type NativeBehavior,
  nativeHost,
  type NativeTouch,
} from "../../foundation/kernel/native-host"
import type { Part } from "../../foundation/kernel/primitive-types"
import { snapToStep } from "../../foundation/number/steps"
import { isRTL } from "../../foundation/platform/env"
import type {
  ColorPickerAreaProps,
  ColorPickerSliderProps,
} from "./color-picker"
import type { ColorPickerApi, State } from "./color-picker-api"
import {
  areaGradient,
  type Channel,
  type ColorChannel,
  type ColorPickerSpace,
  defaultAxes,
  readChannel,
  withChannel,
} from "./color-picker-channels"

type PickerPart = Part<State, ColorPickerApi>
type Shown = { color: Color; space: ColorPickerSpace }
type Box = { left: number; top: number; width: number; height: number }

const isLocked = (state: State) => isDisabled(state) || state.readOnly

const clamp = (fraction: number) => Math.min(1, Math.max(0, fraction))

const snap = (value: number, spec: Channel) =>
  snapToStep(value, { min: 0, max: spec.max, step: spec.step })

function axesOf(api: ColorPickerApi, space: ColorPickerSpace, props: object) {
  const { x, y } = props as ColorPickerAreaProps
  return {
    x: api.internal.channel(x ?? defaultAxes[space].x),
    y: api.internal.channel(y ?? defaultAxes[space].y),
  }
}

const channelOf = (part: PickerPart) =>
  part.api.internal.channel((part.props as ColorPickerSliderProps).channel)

const isVertical = (part: PickerPart) =>
  (part.props as ColorPickerSliderProps).orientation === "vertical"

// The responder's start, move and end make the calls the web's pointerdown
// does: a press jumps there and a drag follows. A responder cancelled, taken
// by a scroll view or unmounted puts the color back and commits nothing.
function follow(
  part: PickerPart,
  colorAt: (touch: NativeTouch, box: Box) => Color | undefined
) {
  const { api, store } = part
  let box: Box | undefined
  const to = (touch: NativeTouch, reason: "track-press" | "drag") => {
    const color = box && colorAt(touch, box)
    if (color) {
      api.internal.dragTo(color, reason)
    }
  }
  const stop = nativeHost()?.follow(part, {
    accepts: () => !isLocked(store.get()),
    start(touch) {
      box = nativeHost()?.box(part)
      api.internal.dragStart("track-press")
      to(touch, "track-press")
    },
    move: (touch) => to(touch, "drag"),
    end: () => api.internal.dragEnd(),
    cancel: () => api.internal.dragCancel(),
  })
  return () => {
    stop?.()
    api.internal.dragCancel()
  }
}

function followArea(part: PickerPart) {
  return follow(part, (touch, box) => {
    const { color, space } = part.store.get()
    const { x, y } = axesOf(part.api, space, part.props)
    const across = box.width ? clamp((touch.x - box.left) / box.width) : 0
    const up = box.height ? clamp(1 - (touch.y - box.top) / box.height) : 0
    const nextX = snap((isRTL(null) ? 1 - across : across) * x.max, x)
    const nextY = snap(up * y.max, y)
    if (nextX === readChannel(color, x) && nextY === readChannel(color, y)) {
      return
    }
    return withChannel(withChannel(color, x, nextX), y, nextY)
  })
}

function followSlider(part: PickerPart) {
  return follow(part, (touch, box) => {
    const spec = channelOf(part)
    const vertical = isVertical(part)
    const length = vertical ? box.height : box.width
    let fraction = length
      ? (vertical ? box.top + box.height - touch.y : touch.x - box.left) /
        length
      : 0
    if (!vertical && isRTL(null)) {
      fraction = 1 - fraction
    }
    const { color } = part.store.get()
    const next = snap(clamp(fraction) * spec.max, spec)
    return next === readChannel(color, spec)
      ? undefined
      : withChannel(color, spec, next)
  })
}

// A screen reader's increment and decrement, a step at a time, as the web's
// arrow keys. The area's thumb is a slider for its x axis, as on the web.
function adjust(part: PickerPart, spec: () => Channel) {
  return nativeHost()?.adjustable(part, (direction) => {
    const { color } = part.store.get()
    const channel = spec()
    const next = snap(
      readChannel(color, channel) + direction * channel.step,
      channel
    )
    if (isLocked(part.store.get()) || next === readChannel(color, channel)) {
      return
    }
    part.api.internal.dragStart("step-key")
    part.api.internal.dragTo(withChannel(color, channel, next), "step-key")
    part.api.internal.dragEnd()
  })
}

/**
 * Color Picker's behavior on the native host, as its `bind` and pointer
 * handlers do on the DOM host: the root reads the direction, the area and
 * each slider follow touch drags, and each thumb takes a screen reader's
 * increment and decrement.
 * @experimental
 */
const colorPickerNative: NativeBehavior<ColorPickerApi> = {
  root: (part: PickerPart) => part.api.internal.setRTL(nativeElement(part)),
  area: followArea,
  slider: followSlider,
  "area-thumb": (part: PickerPart) =>
    adjust(part, () => axesOf(part.api, part.store.get().space, part.props).x),
  "slider-thumb": (part: PickerPart) => adjust(part, () => channelOf(part)),
}

// React Native draws sRGB colors in hex, rgb() and hsl() without alpha.
const drawn = (color: Color) => formatColor(color, "hex")

/**
 * What the native adapter draws a color picker's parts with, where the web
 * reads CSS variables: colors React Native can draw, and gradients for its
 * `backgroundImage`.
 * @experimental
 */
function nativeColorPicker(api: ColorPickerApi) {
  return {
    /** A color as React Native draws it: fit into sRGB, in hex. */
    color: (color: Color) => drawn(color),
    /** The area's background where two gradients draw it, as the web's `--color-area-background`. */
    areaBackground(state: Shown, props: ColorPickerAreaProps) {
      const { x, y } = axesOf(api, state.space, props)
      return areaGradient(
        state.color,
        x.name as ColorChannel,
        y.name as ColorChannel,
        isRTL(null)
      )
    },
    /**
     * The area as `rows` horizontal gradients from top to bottom, each with
     * `columns` stops, where no gradient draws it; colors outside sRGB clear.
     */
    areaRows(
      state: Shown,
      props: ColorPickerAreaProps,
      rows: number,
      columns: number
    ) {
      const { x, y } = axesOf(api, state.space, props)
      const base = { ...state.color, alpha: 1 }
      const across = isRTL(null) ? "to left" : "to right"
      return Array.from({ length: rows }, (_, row) => {
        const atRow = withChannel(base, y, (1 - row / (rows - 1)) * y.max)
        const stops = Array.from({ length: columns }, (_, column) => {
          const color = withChannel(atRow, x, (column / (columns - 1)) * x.max)
          const fits = convertColor(color, "srgb").coords.every(
            (value) => (value ?? 0) >= -1e-6 && (value ?? 0) <= 1 + 1e-6
          )
          return drawn(fits ? color : { ...color, alpha: 0 })
        })
        return `linear-gradient(${across}, ${stops.join(", ")})`
      })
    },
    /** The area thumb's place, from 0 to 1 on each axis, with y from the bottom: the web's `--area-x` and `--area-y`. */
    areaThumb(state: Shown, props: ColorPickerAreaProps) {
      const { x, y } = axesOf(api, state.space, props)
      return {
        x: readChannel(state.color, x) / x.max,
        y: readChannel(state.color, y) / y.max,
      }
    },
    /** A slider's track, as the web's `--color-slider-background`. */
    sliderBackground(
      state: Shown,
      { channel, orientation }: ColorPickerSliderProps
    ) {
      const spec = api.internal.channel(channel)
      const direction =
        orientation === "vertical"
          ? "to top"
          : isRTL(null)
            ? "to left"
            : "to right"
      const count = spec.unit === "°" ? 13 : spec.index === 3 ? 2 : 5
      const stops = Array.from({ length: count }, (_, at) => {
        const stop = withChannel(
          state.color,
          spec,
          (spec.max * at) / (count - 1)
        )
        return drawn(spec.index === 3 ? stop : { ...stop, alpha: 1 })
      })
      return `linear-gradient(${direction}, ${stops.join(", ")})`
    },
  }
}

export { colorPickerNative, nativeColorPicker }
