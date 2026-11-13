// PROTOTYPE (issue #14). Switch on the native host. It needs no native
// behavior of its own: its press comes through the adapter, and its
// controller's `focus()` through the `focus-part` twin.
import {
  switchPrimitive,
  type SwitchOptions,
  type SwitchState,
} from "@ui-sdk/core/switch"
import { Pressable, View } from "react-native"
import { createParts, type PartProps } from "./use-primitive"

const parts = createParts(switchPrimitive, { root: Pressable, thumb: View })

/**
 * The props of `Switch`. A native switch takes part in no form, so `name`,
 * `value` and `form` are absent, and there is no hidden input.
 * @experimental
 */
type SwitchProps = Omit<SwitchOptions, "name" | "value" | "form"> &
  PartProps<SwitchState>

/**
 * A control that turns a setting on or off. A `Pressable` with the switch role.
 * @experimental
 */
const Switch: (props: SwitchProps) => React.ReactElement | null = parts.Root

/**
 * The thumb that slides along the switch as it turns on or off.
 * @experimental
 */
const SwitchThumb = parts.Thumb

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

export { Switch, type SwitchProps, SwitchThumb }
