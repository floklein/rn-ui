import {
  textarea as textareaPrimitive,
  type TextareaOptions,
} from "@ui-sdk/core/input"
import { type TextFieldProps, useTextField } from "./text-field"
import { usePrimitive } from "./use-primitive"

/**
 * A multiline text field: a `TextInput` where Enter adds a line, and that
 * grows with its text. It has no submit shortcut, since `TextInput` reports
 * no modifier keys.
 * @experimental
 */
function Textarea({
  value,
  defaultValue,
  onValueChange,
  controller,
  debug,
  ...props
}: Omit<TextareaOptions, "autoResize" | "onSubmit" | "submitShortcut"> &
  TextFieldProps) {
  const textarea = usePrimitive(textareaPrimitive, {
    value,
    defaultValue,
    onValueChange,
    controller,
    debug,
  })
  return useTextField(textarea, { ...props, multiline: true })
}

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

export { Textarea }
