import {
  otpInput,
  type OTPInputOptions,
  type OTPInputSlotProps,
  type OTPInputSlotState,
  type OTPInputState,
} from "@ui-sdk/core/otp-input"
import { withSource } from "@ui-sdk/core/renderer"
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native"
import { pressSource } from "./native-host"
import { type Interaction, mergeProps } from "./render-element"
import {
  createParts,
  type PartProps,
  type Parts,
  useHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

type OTPInputParts = Parts<
  typeof otpInput,
  { group: typeof View; separator: typeof View }
>

const parts: OTPInputParts = createParts(otpInput, {
  group: View,
  separator: View,
})

// Props that belong to the field, which is what takes focus and is named.
type ControlProps = Pick<TextInputProps, "id" | "autoFocus" | "aria-label"> & {
  "aria-labelledby"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

// The field's own text, caret and selection are hidden: the slots draw them.
const hidden = StyleSheet.create({
  control: {
    position: "absolute",
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: "transparent",
    fontSize: 16,
  },
})

function OTPInputControl(props: ControlProps) {
  const otp = useHandle(otpInput)
  const { value, selection, focused, readOnly, disabled, formDisabled } =
    otp.state
  const editable = !disabled && !formDisabled && !readOnly
  const { internal } = otp.api
  return usePart(
    otp,
    "control",
    {},
    mergeProps(props, {
      value,
      selection: focused ? selection : undefined,
      editable,
      caretHidden: true,
      contextMenuHidden: false,
      selectionColor: "transparent",
      underlineColorAndroid: "transparent",
      style: hidden.control,
      onChangeText: (text: string) =>
        withSource("keyboard", () => internal.typeText(text)),
      onSelectionChange: ({
        nativeEvent,
      }: {
        nativeEvent: { selection: { start: number; end: number } }
      }) => internal.selectText(nativeEvent.selection),
      onFocus: () => internal.focusText(true),
      onBlur: () => internal.focusText(false),
      accessibilityState: { disabled: !editable },
    }),
    TextInput
  )
}

/**
 * Holds the slots, and one `TextInput` under them that takes focus, holds the
 * code and offers one-time codes. `id`, `autoFocus` and the `aria-*` naming
 * props go to that field. It takes part in no form, so it has no `name`.
 * @experimental
 */
function OTPInput({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  maxLength,
  pattern,
  inputMode,
  textAlign,
  autoComplete,
  disabled,
  readOnly,
  required,
  controller,
  debug,
  id,
  autoFocus,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  children,
  ...props
}: Omit<OTPInputOptions, "name" | "form"> &
  ControlProps &
  PartProps<typeof View, OTPInputState>) {
  const otp = usePrimitive(otpInput, {
    value,
    defaultValue,
    onValueChange,
    onValueCommit,
    maxLength,
    pattern,
    inputMode,
    textAlign,
    autoComplete,
    disabled,
    readOnly,
    required,
    controller,
    debug,
  })
  const control = (
    <OTPInputControl
      id={id}
      autoFocus={autoFocus}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid}
    />
  )
  return usePart(
    otp,
    "root",
    {},
    {
      ...props,
      children: (state: OTPInputState, interaction: Interaction) => (
        <>
          {control}
          {typeof children === "function"
            ? children(state, interaction)
            : children}
        </>
      ),
    },
    View
  )
}

/**
 * Lays out a run of slots. Like them, it's only drawn.
 * @experimental
 */
const OTPInputGroup: OTPInputParts["Group"] = parts.Group

const char = (slot: OTPInputSlotState) =>
  slot.char === null ? null : <Text>{slot.char}</Text>

/**
 * One character of the code, drawn over the field. A press selects it.
 * Without children, it shows the character in a `Text`.
 * @experimental
 */
function OTPInputSlot({
  index,
  children = char,
  ...props
}: OTPInputSlotProps & PartProps<typeof Pressable, OTPInputSlotState>) {
  const otp = useHandle(otpInput)
  return usePart(
    otp,
    "slot",
    { index, id: String(index) },
    mergeProps(
      { accessible: false, focusable: false },
      { ...props, children },
      {
        onPress: () =>
          withSource(pressSource(), () => otp.api.internal.pressSlot(index)),
      }
    ),
    Pressable
  )
}

/**
 * Drawn between groups, like a dash.
 * @experimental
 */
const OTPInputSeparator: OTPInputParts["Separator"] = parts.Separator

export { createOTPInputController } from "@ui-sdk/core/otp-input"
export type {
  OTPInputApi,
  OTPInputChangeOptions,
  OTPInputController,
  OTPInputOptions,
  OTPInputPattern,
  OTPInputSlotData,
  OTPInputSlotProps,
  OTPInputSlotState,
  OTPInputState,
  OTPInputValueChangeReason,
  OtpInputPrimitive,
} from "@ui-sdk/core/otp-input"

export { OTPInput, OTPInputGroup, OTPInputSeparator, OTPInputSlot }
