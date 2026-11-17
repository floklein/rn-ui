import { sliderNative } from "@ui-sdk/core/native"
import {
  slider,
  type SliderOptions,
  type SliderPrimitive,
  type SliderState,
  type SliderThumbProps,
  type SliderThumbState,
  type SliderValueState,
} from "@ui-sdk/core/slider"
import { partState } from "@ui-sdk/core/renderer"
import * as React from "react"
import { StyleSheet, Text, View } from "react-native"
import { useFieldControl } from "./field-context"
import { type Interaction, mergeProps, withState } from "./render-element"
import {
  createParts,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  useHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

type SliderParts = Parts<
  SliderPrimitive,
  { control: typeof View; track: typeof View }
>

type LabelledHandle = PrimitiveHandle<SliderPrimitive> & { labelId?: string }

const parts: SliderParts = createParts(slider, { control: View, track: View })

/**
 * The root: a group around the thumbs. It takes part in no form, so it has
 * no hidden input and no `name`.
 * @experimental
 */
function Slider<Value extends number | number[] = number | number[]>({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min,
  max,
  step,
  largeStep,
  minStepsBetweenThumbs,
  orientation,
  disabled,
  readOnly,
  required,
  format,
  locale,
  controller,
  debug,
  ...props
}: Omit<SliderOptions<Value>, "name" | "form"> &
  PartProps<typeof View, SliderState>) {
  const handle = usePrimitive(
    slider,
    {
      value,
      defaultValue,
      onValueChange: onValueChange as SliderOptions["onValueChange"],
      onValueCommit: onValueCommit as SliderOptions["onValueCommit"],
      min,
      max,
      step,
      largeStep,
      minStepsBetweenThumbs,
      orientation,
      disabled,
      readOnly,
      required,
      format,
      locale,
      controller,
      debug,
    },
    sliderNative
  )
  const id = (props.id ?? props.nativeID) as string | undefined
  const labelled = React.useMemo<LabelledHandle>(
    () => Object.assign(Object.create(handle), { labelId: id }),
    [handle, id]
  )
  return usePart(labelled, "root", {}, props as Record<string, unknown>, View)
}

/**
 * Where touches land: a touch moves the nearest thumb there, and a drag
 * moves it along.
 * @experimental
 */
const SliderControl: SliderParts["Control"] = parts.Control

/**
 * The rail the thumbs move along. Positions are percentages of it.
 * @experimental
 */
const SliderTrack: SliderParts["Track"] = parts.Track

type Indicator = { indicatorStart: number; indicatorSize: number }

/**
 * The state `SliderIndicator` hands its style, class name, children and
 * `render`: the slider's, with where the fill starts and how long it is.
 * @experimental
 */
type SliderIndicatorState = SliderState & {
  /** Where the fill starts along the track, from 0 to 100. */
  indicatorStart: number
  /** How much of the track the fill covers, from 0 to 100. */
  indicatorSize: number
}

const percent = (value: number, { min, max }: { min: number; max: number }) =>
  max > min ? (Math.min(Math.max(value, min), max) - min) / (max - min) : 0

/**
 * The filled part of the track: up to a single thumb, or between a range's
 * thumbs. Its state adds where the fill starts and how long it is, the
 * web's CSS variables.
 * @experimental
 */
function SliderIndicator(props: PartProps<typeof View, SliderIndicatorState>) {
  const handle = useHandle(slider)
  const box = (state: SliderState) => {
    const values = Array.isArray(state.value) ? state.value : [state.value]
    const start = values.length > 1 ? percent(values[0], handle.state) : 0
    const end = percent(values[values.length - 1], handle.state)
    return {
      indicatorStart: Math.round(start * 1e6) / 1e4,
      indicatorSize: Math.round((end - start) * 1e6) / 1e4,
    }
  }
  const fill = (state: SliderState) => {
    const { indicatorStart, indicatorSize } = box(state)
    return state.orientation === "vertical"
      ? {
          position: "absolute" as const,
          start: 0,
          end: 0,
          bottom: `${indicatorStart}%` as const,
          height: `${indicatorSize}%` as const,
        }
      : {
          position: "absolute" as const,
          top: 0,
          bottom: 0,
          start: `${indicatorStart}%` as const,
          width: `${indicatorSize}%` as const,
        }
  }
  return usePart(
    slider,
    "indicator",
    {},
    mergeProps(
      { style: fill },
      { ...props, ...withState<SliderState, Indicator>(props, box) }
    ),
    View
  )
}

// A box as long as the track, centered on the value, centers the thumb on
// it in either direction without measuring the thumb.
function place(state: SliderThumbState) {
  const offset = `${state.percent - 50}%` as const
  const rest = `${50 - state.percent}%` as const
  return state.orientation === "vertical"
    ? { top: rest, bottom: offset, start: 0, end: 0 }
    : { start: offset, end: rest, top: 0, bottom: 0 }
}

/**
 * A thumb, a `View`, with the element screen readers adjust filling it. Its
 * `aria-label`, `aria-labelledby` and `aria-describedby` name that element;
 * inside a Field, the field's label names every thumb, and outside one, a
 * Label for the slider's `id` names those without a name of their own.
 * @experimental
 */
function SliderThumb({
  index = 0,
  children,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: PartProps<typeof View, SliderThumbState> &
  SliderThumbProps & {
    "aria-label"?: string
    "aria-labelledby"?: string
    "aria-describedby"?: string
  }) {
  const id = String(index)
  const input = (
    <ThumbInput
      index={index}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    />
  )
  const thumb = usePart(
    slider,
    "thumb",
    { index, id },
    {
      ...(props as Record<string, unknown>),
      children: (state: SliderThumbState, interaction: Interaction) => (
        <>
          {typeof children === "function"
            ? children(state, interaction)
            : children}
          {input}
        </>
      ),
    },
    View
  )
  const handle = useHandle(slider)
  const state = partState(handle.instance.part("thumb", { index, id }), {
    index,
    id,
  }) as SliderThumbState
  return (
    <View pointerEvents="box-none" style={[styles.place, place(state)]}>
      {thumb}
    </View>
  )
}

// The element a screen reader focuses and adjusts, as the web's range input.
function ThumbInput({
  index,
  ...named
}: {
  index: number
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}) {
  const handle = useHandle(slider) as LabelledHandle
  const { id: _, ...user } = useFieldControl(
    { ...named, id: handle.labelId, accessible: true, style: styles.input },
    () => handle.api.focus()
  )
  return usePart(
    slider,
    "thumb-input",
    { index, id: String(index) },
    user as Record<string, unknown>,
    View
  )
}

const text = (state: SliderValueState) => state.text

/**
 * The formatted value, a range joined with an en dash, a `Text`. Children
 * replace it. Screen readers hear the value from each thumb, so this text is
 * hidden from them.
 * @experimental
 */
function SliderValue({
  children = text,
  ...props
}: PartProps<typeof Text, SliderValueState>) {
  return usePart(
    slider,
    "value",
    {},
    { "aria-hidden": true, ...(props as Record<string, unknown>), children },
    Text
  )
}

// Past the thumb on every side, so a 20-point thumb is a 44-point target.
const reach = -12

const styles = StyleSheet.create({
  input: {
    position: "absolute",
    top: reach,
    bottom: reach,
    start: reach,
    end: reach,
  },
  place: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
})

export { createSliderController } from "@ui-sdk/core/slider"
export type { SliderIndicatorState }
export type {
  NumberFormat,
  SliderApi,
  SliderChangeOptions,
  SliderController,
  SliderOptions,
  SliderPrimitive,
  SliderState,
  SliderThumbProps,
  SliderThumbState,
  SliderValueChangeDetails,
  SliderValueChangeReason,
  SliderValueCommitDetails,
  SliderValueState,
} from "@ui-sdk/core/slider"

export {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
  SliderValue,
}
