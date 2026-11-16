import { gaugeNative } from "@ui-sdk/core/native"
import {
  progress,
  type ProgressPrimitive,
  type ProgressState,
  type ProgressValueState,
} from "@ui-sdk/core/progress"
import { Text, View } from "react-native"
import { mergeProps } from "./render-element"
import {
  createParts,
  type PartProps,
  type Parts,
  usePart,
} from "./use-primitive"

type ProgressParts = Parts<
  ProgressPrimitive,
  { root: typeof View; track: typeof View; label: typeof Text }
>

const parts: ProgressParts = createParts(
  progress,
  { root: View, track: View, label: Text },
  gaugeNative
)

/**
 * The root, which is the progress bar: one element a screen reader reads
 * with its value. Name it with a `ProgressLabel` inside it or `aria-label`.
 * @experimental
 */
const Progress: ProgressParts["Root"] = parts.Root

/**
 * The rail the indicator fills.
 * @experimental
 */
const ProgressTrack: ProgressParts["Track"] = parts.Track

/**
 * Names the progress bar, a `Text`.
 * @experimental
 */
const ProgressLabel: ProgressParts["Label"] = parts.Label

const fill = (state: ProgressState) =>
  state.percent === null
    ? undefined
    : { start: 0, width: `${state.percent}%` as const }

/**
 * The filled part of the track, as wide as the value from the track's start.
 * Indeterminate, it has no width: give it one in `style`.
 * @experimental
 */
function ProgressIndicator(props: PartProps<typeof View, ProgressState>) {
  return usePart(
    progress,
    "indicator",
    {},
    mergeProps({ style: fill }, props),
    View
  )
}

const text = (state: ProgressValueState) => state.text

/**
 * The formatted value, like "40%", a `Text`. Children replace it. Screen
 * readers hear the value from the bar, so this text is hidden from them.
 * @experimental
 */
function ProgressValue({
  children = text,
  ...props
}: PartProps<typeof Text, ProgressValueState>) {
  return usePart(
    progress,
    "value",
    {},
    { "aria-hidden": true, ...(props as Record<string, unknown>), children },
    Text
  )
}

export type {
  GaugeLabelDetails,
  NumberFormat,
  ProgressOptions,
  ProgressPrimitive,
  ProgressState,
  ProgressStatus,
  ProgressValueState,
} from "@ui-sdk/core/progress"

export {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
}
