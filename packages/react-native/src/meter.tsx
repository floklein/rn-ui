import { gaugeNative } from "@ui-sdk/core/native"
import {
  meter,
  type MeterPrimitive,
  type MeterState,
  type MeterValueState,
} from "@ui-sdk/core/meter"
import { Text, View } from "react-native"
import { mergeProps } from "./render-element"
import {
  createParts,
  type PartProps,
  type Parts,
  usePart,
} from "./use-primitive"

type MeterParts = Parts<
  MeterPrimitive,
  { root: typeof View; track: typeof View; label: typeof Text }
>

const parts: MeterParts = createParts(
  meter,
  { root: View, track: View, label: Text },
  gaugeNative
)

/**
 * The root, which is the meter: one element a screen reader reads with its
 * value. Name it with a `MeterLabel` inside it or `aria-label`.
 * @experimental
 */
const Meter: MeterParts["Root"] = parts.Root

/**
 * The rail the indicator fills.
 * @experimental
 */
const MeterTrack: MeterParts["Track"] = parts.Track

/**
 * Names the meter, a `Text`.
 * @experimental
 */
const MeterLabel: MeterParts["Label"] = parts.Label

const fill = (state: MeterState) => ({
  start: 0,
  width: `${state.percent}%` as const,
})

/**
 * The filled part of the track, as wide as the value from the track's start.
 * @experimental
 */
function MeterIndicator(props: PartProps<typeof View, MeterState>) {
  return usePart(
    meter,
    "indicator",
    {},
    mergeProps({ style: fill }, props),
    View
  )
}

const text = (state: MeterValueState) => state.text

/**
 * The formatted value, like "40%", a `Text`. Children replace it. Screen
 * readers hear the value from the bar, so this text is hidden from them.
 * @experimental
 */
function MeterValue({
  children = text,
  ...props
}: PartProps<typeof Text, MeterValueState>) {
  return usePart(
    meter,
    "value",
    {},
    { "aria-hidden": true, ...(props as Record<string, unknown>), children },
    Text
  )
}

export type {
  MeterLabelDetails,
  MeterOptions,
  MeterPrimitive,
  MeterState,
  MeterValueState,
  NumberFormat,
} from "@ui-sdk/core/meter"

export { Meter, MeterIndicator, MeterLabel, MeterTrack, MeterValue }
