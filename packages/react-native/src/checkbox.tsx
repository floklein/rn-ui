import {
  checkbox,
  checkboxGroup,
  type CheckboxGroupController,
  type CheckboxGroupOptions,
  type CheckboxGroupState,
  type CheckboxOptions,
  type CheckboxPrimitive,
  type CheckboxState,
} from "@ui-sdk/core/checkbox"
import { checkboxNative } from "@ui-sdk/core/native"
import { type PresenceState, withSource } from "@ui-sdk/core/renderer"
import * as React from "react"
import { Pressable, View } from "react-native"
import { FieldContext, useFieldControl } from "./field-context"
import { pressSource } from "./native-host"
import {
  createParts,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

type CheckboxParts = Parts<CheckboxPrimitive, { indicator: typeof View }>

const parts: CheckboxParts = createParts(checkbox, { indicator: View })

const CheckboxGroupContext = React.createContext<PrimitiveHandle<
  typeof checkboxGroup
> | null>(null)

/**
 * A checkbox: a `Pressable` with the checkbox role. It takes part in no
 * form, so it has no hidden input. Inside a `CheckboxGroup`, the group
 * decides whether it's checked.
 * @experimental
 */
function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  readOnly,
  required,
  value,
  controller,
  parent,
  debug,
  ...props
}: Omit<CheckboxOptions, "name" | "form"> &
  PartProps<typeof Pressable, CheckboxState>) {
  const group = React.useContext(CheckboxGroupContext)
  const fromGroup = React.useMemo(
    () => (group ? () => group.api : undefined),
    [group]
  )
  const handle = usePrimitive(
    checkbox,
    {
      checked,
      defaultChecked,
      onCheckedChange,
      disabled,
      readOnly,
      required,
      value,
      controller,
      parent,
      debug,
      group: fromGroup,
    } as CheckboxOptions,
    checkboxNative
  )
  const user = useFieldControl(props as Record<string, unknown>, () =>
    withSource(pressSource(), () => handle.api.toggle({ reason: "press" }))
  )
  return usePart(handle, "root", {}, user, Pressable)
}

/**
 * The check inside the checkbox. Rendered while it's checked or
 * indeterminate, or always with `keepMounted`. Pass `onExit` to keep it
 * mounted while it animates out.
 * @experimental
 */
const CheckboxIndicator: CheckboxParts["Indicator"] = parts.Indicator

/**
 * Checkboxes that share a list of checked values. The group, not each
 * checkbox, holds the value. It takes part in no form, so it has no `name`.
 * `T` is inferred from `value`, `defaultValue` or `onValueChange`.
 * @experimental
 */
function CheckboxGroup<T extends string = string>({
  value,
  defaultValue,
  onValueChange,
  allValues,
  readOnly,
  disabled,
  required,
  controller,
  debug,
  ...props
}: Omit<CheckboxGroupOptions<T>, "name" | "form"> &
  Omit<PartProps<typeof View, CheckboxGroupState>, "onChange">) {
  const group = usePrimitive(checkboxGroup, {
    value,
    defaultValue,
    onValueChange: onValueChange as CheckboxGroupOptions["onValueChange"],
    allValues,
    disabled,
    readOnly,
    required,
    controller: controller as CheckboxGroupController | undefined,
    debug,
  })
  return (
    <CheckboxGroupContext value={group}>
      {/* A checkbox in a group joins only a Field inside the group. */}
      <FieldContext value={null}>
        {usePart(group, "group", {}, props as Record<string, unknown>, View)}
      </FieldContext>
    </CheckboxGroupContext>
  )
}

/**
 * The state the indicator hands `style`, `className`, `children` and
 * `render` functions: the checkbox's, with the first-frame and closing flags.
 * @experimental
 */
type CheckboxIndicatorState = CheckboxState & PresenceState

export {
  createCheckboxController,
  createCheckboxGroupController,
} from "@ui-sdk/core/checkbox"
export type {
  CheckboxApi,
  CheckboxChangeOptions,
  CheckboxCheckedChangeReason,
  CheckboxController,
  CheckboxGroupApi,
  CheckboxGroupChangeOptions,
  CheckboxGroupController,
  CheckboxGroupOptions,
  CheckboxGroupPrimitive,
  CheckboxGroupState,
  CheckboxGroupValueChangeReason,
  CheckboxIndicatorProps,
  CheckboxOptions,
  CheckboxPrimitive,
  CheckboxState,
  CheckedState,
} from "@ui-sdk/core/checkbox"

export {
  Checkbox,
  CheckboxGroup,
  CheckboxIndicator,
  type CheckboxIndicatorState,
}
