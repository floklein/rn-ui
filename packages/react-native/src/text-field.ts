import type {
  InputGroupPrimitive,
  InputPrimitive,
  InputProps as ControlProps,
  InputState,
  TextareaPrimitive,
} from "@ui-sdk/core/input"
import { withSource } from "@ui-sdk/core/renderer"
import * as React from "react"
import { TextInput } from "react-native"
import { fields } from "./native-host"
import { mergeProps } from "./render-element"
import { type PartProps, type PrimitiveHandle, usePart } from "./use-primitive"

type TextFieldProps = Omit<
  PartProps<typeof TextInput, InputState>,
  "value" | "defaultValue" | "editable"
> &
  ControlProps

const GroupContext =
  React.createContext<PrimitiveHandle<InputGroupPrimitive> | null>(null)

// What the group's `bind` reads from the element on the web.
function useGroup(
  field: PrimitiveHandle<InputPrimitive>,
  { disabled = false, readOnly = false }: ControlProps
) {
  const group = React.useContext(GroupContext)
  const { filled } = field.state
  React.useLayoutEffect(() => {
    if (!group) {
      return
    }
    fields.set(group.api, field.api)
    return () => {
      if (fields.get(group.api) === field.api) {
        fields.delete(group.api)
      }
    }
  }, [group, field])
  React.useLayoutEffect(() => {
    group?.api.internal.update({ filled, disabled, readOnly })
  }, [group, filled, disabled, readOnly])
}

// Always controlled, so a canceled change or a controlled value puts the text back.
function useTextField(
  handle: PrimitiveHandle<InputPrimitive> | PrimitiveHandle<TextareaPrimitive>,
  { disabled, readOnly, required, ...props }: TextFieldProps
) {
  const field = handle as PrimitiveHandle<InputPrimitive>
  useGroup(field, { disabled, readOnly })
  const type = (text: string) =>
    withSource("keyboard", () =>
      field.api.setValue(text, { reason: "input-change" })
    )
  return usePart(
    field,
    "root",
    { disabled, readOnly, required },
    mergeProps(props, {
      value: field.state.value,
      editable: !disabled && !readOnly,
      "aria-disabled": disabled || undefined,
      onChangeText: type,
    }),
    TextInput
  )
}

export { GroupContext, type TextFieldProps, useTextField }
