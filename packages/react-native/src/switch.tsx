import { withSource } from "@ui-sdk/core/renderer"
import {
  switchPrimitive,
  type SwitchOptions,
  type SwitchPrimitive,
  type SwitchState,
} from "@ui-sdk/core/switch"
import { Pressable, View } from "react-native"
import { useFieldControl } from "./field-context"
import { pressSource } from "./native-host"
import {
  createParts,
  type PartProps,
  type Parts,
  usePart,
  usePrimitive,
} from "./use-primitive"

type SwitchParts = Parts<SwitchPrimitive, { thumb: typeof View }>

const parts: SwitchParts = createParts(switchPrimitive, { thumb: View })

/**
 * A control that turns a setting on or off: a `Pressable` with the switch
 * role. It takes part in no form, so it has no hidden input and no `value`. Inside a Field,
 * the field's label names it and presses it.
 * @experimental
 */
function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  readOnly,
  required,
  controller,
  debug,
  ...props
}: Omit<SwitchOptions, "name" | "form" | "value"> &
  PartProps<typeof Pressable, SwitchState>) {
  const handle = usePrimitive(switchPrimitive, {
    checked,
    defaultChecked,
    onCheckedChange,
    disabled,
    readOnly,
    required,
    controller,
    debug,
  })
  const user = useFieldControl(props as Record<string, unknown>, () =>
    withSource(pressSource(), () => handle.api.toggle({ reason: "press" }))
  )
  return usePart(handle, "root", {}, user, Pressable)
}

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
