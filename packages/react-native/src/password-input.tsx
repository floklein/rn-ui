import {
  passwordInput,
  type PasswordInputOptions,
  type PasswordInputPrimitive,
  type PasswordInputState,
} from "@ui-sdk/core/password-input"
import * as React from "react"
import { Pressable, TextInput, type View } from "react-native"
import { fields } from "./native-host"
import { mergeProps } from "./render-element"
import { typing } from "./text-field"
import {
  createParts,
  type PartProps,
  type Parts,
  useHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

type PasswordInputParts = Parts<
  PasswordInputPrimitive,
  { toggle: typeof Pressable }
>

const parts: PasswordInputParts = createParts(passwordInput, {
  toggle: Pressable,
})

/**
 * Holds the field and its toggle: a `Pressable` that isn't an accessible
 * element itself. A press on its text and icons starts editing the field. It
 * takes part in no form, so it has no `name`.
 * @experimental
 */
function PasswordInput({
  value,
  defaultValue,
  onValueChange,
  visible,
  defaultVisible,
  onVisibleChange,
  autoComplete,
  required,
  disabled,
  readOnly,
  controller,
  debug,
  ...props
}: Omit<PasswordInputOptions, "name" | "form"> &
  PartProps<typeof View, PasswordInputState>) {
  const password = usePrimitive(passwordInput, {
    value,
    defaultValue,
    onValueChange,
    visible,
    defaultVisible,
    onVisibleChange,
    autoComplete,
    required,
    disabled,
    readOnly,
    controller,
    debug,
  })
  React.useLayoutEffect(() => {
    fields.set(password.api, password.api)
    return () => {
      fields.delete(password.api)
    }
  }, [password])
  return usePart(
    password,
    "root",
    {},
    mergeProps({ accessible: false, focusable: false }, props),
    Pressable
  )
}

/**
 * The `TextInput`, with secure entry while the password is hidden. What it
 * fills in and whether it's editable come from `<PasswordInput>`.
 * @experimental
 */
function PasswordInputControl({
  id,
  ...props
}: Omit<
  PartProps<typeof TextInput, PasswordInputState>,
  | "value"
  | "defaultValue"
  | "editable"
  | "secureTextEntry"
  | "autoComplete"
  | "readOnly"
>) {
  const password = useHandle(passwordInput)
  const { disabled, readOnly } = password.state
  const editable = !disabled && !readOnly
  return usePart(
    password,
    "control",
    { id },
    mergeProps(props, {
      ...typing(password),
      editable,
      // Android keeps a TextInput disabled when its disabled state is left
      // out, and enables a read-only one, which then takes typing, when it's false.
      accessibilityState: { disabled: !editable, ...props.accessibilityState },
    }),
    TextInput
  )
}

/**
 * Shows and hides the password. Name it by what it does, like "Show password":
 * it's a toggle button, checked while the password is shown.
 * @experimental
 */
const PasswordInputToggle: PasswordInputParts["Toggle"] = parts.Toggle

export { createPasswordInputController } from "@ui-sdk/core/password-input"
export type {
  InputValueChangeReason,
  PasswordInputController,
  PasswordInputOptions,
  PasswordInputPrimitive,
  PasswordInputState,
  PasswordInputVisibleChangeReason,
} from "@ui-sdk/core/password-input"

export { PasswordInput, PasswordInputControl, PasswordInputToggle }
