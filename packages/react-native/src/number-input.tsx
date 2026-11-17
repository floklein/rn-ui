import { numberInputNative } from "@ui-sdk/core/native"
import {
  numberInput,
  type NumberInputButtonProps,
  type NumberInputButtonState,
  type NumberInputOptions,
  type NumberInputPrimitive,
  type NumberInputScrubAreaProps,
  type NumberInputState,
} from "@ui-sdk/core/number-input"
import { withSource } from "@ui-sdk/core/renderer"
import * as React from "react"
import {
  Platform,
  Pressable,
  TextInput,
  type TextInputSelectionChangeEvent,
  View,
} from "react-native"
import { useFieldControl } from "./field-context"
import { pressSource } from "./native-host"
import { type Interaction, mergeProps, renderElement } from "./render-element"
import {
  createParts,
  type PartProps,
  type Parts,
  useHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

type NumberInputParts = Parts<NumberInputPrimitive, { group: typeof View }>

const parts: NumberInputParts = createParts(numberInput, { group: View })

/**
 * The root. It takes part in no form, so it has no hidden input and no
 * `name`, and with no mouse wheel it has no `wheel`.
 * @experimental
 */
function NumberInput({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min,
  max,
  step,
  largeStep,
  smallStep,
  format,
  locale,
  disabled,
  readOnly,
  required,
  controller,
  debug,
  ...props
}: Omit<NumberInputOptions, "name" | "form" | "wheel"> &
  PartProps<typeof View, NumberInputState>) {
  const handle = usePrimitive(
    numberInput,
    {
      value,
      defaultValue,
      onValueChange,
      onValueCommit,
      min,
      max,
      step,
      largeStep,
      smallStep,
      format,
      locale,
      disabled,
      readOnly,
      required,
      controller,
      debug,
    },
    numberInputNative
  )
  React.useLayoutEffect(() => {
    handle.api.internal.setPlatform(Platform.OS === "ios" ? "ios" : "android")
  }, [handle])
  return usePart(handle, "root", {}, props as Record<string, unknown>, View)
}

/**
 * Holds the field and its buttons.
 * @experimental
 */
const NumberInputGroup: NumberInputParts["Group"] = parts.Group

/**
 * The `TextInput`, which shows the formatted number and takes typing. An
 * edit that can't become a number shows for a moment, then the text is
 * written back with the selection it had. Leaving it or pressing Enter
 * commits what's typed.
 * @experimental
 */
function NumberInputControl({
  render,
  ...props
}: Omit<
  PartProps<typeof TextInput, NumberInputState>,
  "value" | "defaultValue" | "editable" | "selection" | "readOnly"
>) {
  const handle = useHandle(numberInput)
  const { text, selection, disabled, formDisabled, readOnly, min } =
    handle.state
  const { internal } = handle.api
  const editable = !disabled && !formDisabled && !readOnly
  // On Android `inputMode="numeric"` is the bare number pad, and it wins over
  // `keyboardType`: only `keyboardType="numeric"` asks for the minus and
  // decimal keys a field that takes negatives needs.
  const signed = Platform.OS === "android" && min < 0
  return usePart(
    handle,
    "control",
    {},
    mergeProps(
      useFieldControl(props, () => {
        if (!disabled && !formDisabled) {
          handle.api.focus()
        }
      }),
      {
        value: text,
        selection: selection ?? undefined,
        editable,
        onChangeText: (next: string) =>
          withSource("keyboard", () => internal.typeText(next)),
        onSelectionChange: ({ nativeEvent }: TextInputSelectionChangeEvent) =>
          internal.selectText(nativeEvent.selection),
        onBlur: () => internal.focusText(false),
        onSubmitEditing: () =>
          withSource("keyboard", () => internal.commitText()),
        // Android enables a read-only TextInput, which then takes typing,
        // when its disabled state is false.
        accessibilityState: {
          disabled: !editable,
          ...props.accessibilityState,
        },
        render: signed
          ? (
              own: Record<string, unknown>,
              state: NumberInputState,
              interaction: Interaction
            ) =>
              renderElement(
                TextInput,
                { ...own, inputMode: undefined, keyboardType: "numeric" },
                render,
                state,
                interaction
              )
          : render,
      }
    ),
    TextInput
  )
}

function useStepButton(
  slot: "increment" | "decrement",
  direction: 1 | -1,
  {
    disabled,
    ...props
  }: NumberInputButtonProps &
    PartProps<typeof Pressable, NumberInputButtonState>
) {
  const handle = useHandle(numberInput)
  const { internal } = handle.api
  return usePart(
    handle,
    slot,
    { disabled },
    mergeProps(props, {
      onPressIn: () =>
        withSource(pressSource(), () => internal.pressStep(direction)),
      onPressOut: () => withSource(pressSource(), internal.releaseStep),
      onPress: () =>
        withSource(pressSource(), () => internal.activateStep(direction)),
    }),
    Pressable
  )
}

/**
 * Steps up as the finger goes down, then repeats while it's held. A screen
 * reader's activation steps once.
 * @experimental
 */
function NumberInputIncrement(
  props: NumberInputButtonProps &
    PartProps<typeof Pressable, NumberInputButtonState>
) {
  return useStepButton("increment", 1, props)
}

/**
 * Steps down as the finger goes down, then repeats while it's held. A screen
 * reader's activation steps once.
 * @experimental
 */
function NumberInputDecrement(
  props: NumberInputButtonProps &
    PartProps<typeof Pressable, NumberInputButtonState>
) {
  return useStepButton("decrement", -1, props)
}

/**
 * Drag across it to change the value; a tap starts editing the field. It
 * works inside its number input only.
 * @experimental
 */
function NumberInputScrubArea({
  orientation,
  pixelsPerStep,
  ...props
}: Omit<NumberInputScrubAreaProps, "controller"> &
  PartProps<typeof View, NumberInputState>) {
  const handle = useHandle(numberInput)
  const { disabled, formDisabled, readOnly } = handle.state
  return usePart(
    handle,
    "scrub-area",
    { orientation, pixelsPerStep },
    mergeProps(
      {
        // A pressable label inside would take the touch first; the web's
        // scrub starts from any pointerdown inside, and a tap focuses anyway.
        onStartShouldSetResponderCapture: () =>
          !disabled && !formDisabled && !readOnly,
      },
      props as Record<string, unknown>
    ),
    View
  )
}

export { createNumberInputController } from "@ui-sdk/core/number-input"
export type {
  NumberInputApi,
  NumberInputButtonProps,
  NumberInputButtonState,
  NumberInputChangeOptions,
  NumberInputController,
  NumberInputOptions,
  NumberInputPrimitive,
  NumberInputScrubAreaProps,
  NumberInputState,
  NumberInputValueChangeReason,
} from "@ui-sdk/core/number-input"

export {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
  NumberInputScrubArea,
}
