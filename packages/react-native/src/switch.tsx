import { switchPrimitive, type SwitchPrimitive } from "@ui-sdk/core/switch"
import type * as React from "react"
import { Pressable, View } from "react-native"
import { createParts, type Parts } from "./use-primitive"

type SwitchParts = Parts<
  SwitchPrimitive,
  { root: typeof Pressable; thumb: typeof View }
>

const parts: SwitchParts = createParts(switchPrimitive, {
  root: Pressable,
  thumb: View,
})

/**
 * A control that turns a setting on or off: a `Pressable` with the switch
 * role. It takes part in no form, so it has no hidden input and no `value`.
 * @experimental
 */
const Switch: (
  props: Omit<React.ComponentProps<SwitchParts["Root"]>, "value">
) => React.ReactNode = parts.Root

/**
 * The thumb that slides along the switch as it turns on or off.
 * @experimental
 */
const SwitchThumb: SwitchParts["Thumb"] = parts.Thumb

export { createSwitchController } from "@ui-sdk/core/switch"
export type {
  SwitchApi,
  SwitchCheckedChangeReason,
  SwitchController,
  SwitchOptions,
  SwitchPrimitive,
  SwitchState,
  SwitchThumbState,
} from "@ui-sdk/core/switch"

export { Switch, SwitchThumb }
