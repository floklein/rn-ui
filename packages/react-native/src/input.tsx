import {
  input as inputPrimitive,
  inputGroup,
  type InputGroupOptions,
  type InputGroupState,
  type InputOptions,
} from "@ui-sdk/core/input"
import { Pressable, View } from "react-native"
import { GroupContext, type TextFieldProps, useTextField } from "./text-field"
import {
  createParts,
  type PartProps,
  usePart,
  usePrimitive,
} from "./use-primitive"

/**
 * A single-line text field: a `TextInput`. Enter submits nothing; its
 * `onSubmitEditing` says the user pressed it.
 * @experimental
 */
function Input({
  value,
  defaultValue,
  onValueChange,
  controller,
  debug,
  ...props
}: InputOptions & TextFieldProps) {
  const input = usePrimitive(inputPrimitive, {
    value,
    defaultValue,
    onValueChange,
    controller,
    debug,
  })
  return useTextField(input, props)
}

const parts = createParts(inputGroup, { clear: Pressable })

/**
 * Holds an Input or Textarea with text, icons and buttons around it: a `View`
 * that isn't an accessible element itself. A press on its text and icons
 * starts editing the field.
 * @experimental
 */
function InputGroup({
  debug,
  ...props
}: InputGroupOptions & PartProps<typeof View, InputGroupState>) {
  const group = usePrimitive(inputGroup, { debug })
  return (
    <GroupContext value={group}>
      {usePart(
        group,
        "group",
        {},
        { accessible: false, focusable: false, ...props },
        Pressable
      )}
    </GroupContext>
  )
}

/**
 * Empties the field in its group and starts editing it: a `Pressable` with
 * the button role, shown while there's text to clear.
 * @experimental
 */
const InputClear = parts.Clear

export { createInputController } from "@ui-sdk/core/input"
export type {
  InputController,
  InputGroupOptions,
  InputGroupPrimitive,
  InputGroupState,
  InputOptions,
  InputPrimitive,
  InputProps,
  InputState,
  InputValueChangeReason,
  TextareaOptions,
  TextareaPrimitive,
  TextareaProps,
  TextareaState,
} from "@ui-sdk/core/input"

export { Input, InputClear, InputGroup }
