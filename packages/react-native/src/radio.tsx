import { radioNative } from "@ui-sdk/core/native"
import {
  radioGroup,
  type RadioGroupController,
  type RadioGroupOptions,
  type RadioGroupPrimitive,
  type RadioGroupState,
  type RadioProps,
  type RadioState,
} from "@ui-sdk/core/radio"
import type { PresenceState } from "@ui-sdk/core/renderer"
import { Pressable, View } from "react-native"
import {
  createParts,
  type PartProps,
  type Parts,
  usePart,
  usePrimitive,
} from "./use-primitive"

type RadioParts = Parts<RadioGroupPrimitive, { indicator: typeof View }>

const parts: RadioParts = createParts(radioGroup, { indicator: View })

/**
 * Radios that share one value. Each radio is its own accessible element. It
 * takes part in no form, so it has no `name`. `T` is inferred from `value`,
 * `defaultValue` or `onValueChange`.
 * @experimental
 */
function RadioGroup<T extends string = string>({
  value,
  defaultValue,
  onValueChange,
  disabled,
  readOnly,
  required,
  loop,
  controller,
  debug,
  ...props
}: Omit<RadioGroupOptions<T>, "name" | "form"> &
  Omit<PartProps<typeof View, RadioGroupState>, "onChange">) {
  const group = usePrimitive(
    radioGroup,
    {
      value,
      defaultValue,
      onValueChange: onValueChange as RadioGroupOptions["onValueChange"],
      disabled,
      readOnly,
      required,
      loop,
      controller: controller as RadioGroupController | undefined,
      debug,
    },
    radioNative
  )
  return usePart(group, "group", {}, props as Record<string, unknown>, View)
}

/**
 * A radio: a `Pressable` with the radio role. It has no hidden input.
 * @experimental
 */
function Radio({
  value,
  disabled,
  ...props
}: RadioProps & PartProps<typeof Pressable, RadioState>) {
  return usePart(
    radioGroup,
    "root",
    { value, disabled },
    props as Record<string, unknown>,
    Pressable
  )
}

/**
 * The dot inside the radio. Rendered while it's checked, or always with
 * `keepMounted`. Pass `onExit` to keep it mounted while it animates out.
 * @experimental
 */
const RadioIndicator: RadioParts["Indicator"] = parts.Indicator

/**
 * The state the indicator hands `style`, `className`, `children` and
 * `render` functions: the radio's, with the first-frame and closing flags.
 * @experimental
 */
type RadioIndicatorState = RadioState & PresenceState

export { createRadioGroupController } from "@ui-sdk/core/radio"
export type {
  RadioGroupApi,
  RadioGroupChangeOptions,
  RadioGroupController,
  RadioGroupOptions,
  RadioGroupPrimitive,
  RadioGroupState,
  RadioGroupValueChangeReason,
  RadioIndicatorProps,
  RadioProps,
  RadioState,
} from "@ui-sdk/core/radio"

export { Radio, RadioGroup, RadioIndicator, type RadioIndicatorState }
