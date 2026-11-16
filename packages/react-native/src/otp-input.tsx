import {
  otpInput,
  type OTPInputOptions,
  type OTPInputSlotProps,
  type OTPInputSlotState,
  type OTPInputState,
} from "@ui-sdk/core/otp-input"
import { withSource } from "@ui-sdk/core/renderer"
import { createContext, useCallback, useContext, useRef } from "react"
import {
  type GestureResponderEvent,
  type HostInstance,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextInputSelectionChangeEvent,
  View,
} from "react-native"
import { useFieldControl } from "./field-context"
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

type Views = { root: HostInstance | null; slots: Map<number, HostInstance> }

const ViewsContext = createContext<Views>({ root: null, slots: new Map() })

// Groups and separators offset slots, so each is measured from the root,
// as the field is. Fabric measures synchronously.
function slotAt({ root, slots }: Views, field: HostInstance | null, x: number) {
  if (!root || !field) {
    return undefined
  }
  let fieldStart = 0
  field.measureLayout(root, (left) => {
    fieldStart = left
  })
  let nearest: number | undefined
  let distance = Infinity
  for (const [index, view] of slots) {
    view.measureLayout(root, (left, _top, width) => {
      const start = left - fieldStart
      const away = Math.max(start - x, x - start - width, 0)
      if (away < distance) {
        distance = away
        nearest = index
      }
    })
  }
  return nearest
}

// The field lies over the slots so a long press anywhere offers Paste. iOS
// draws selection handles whatever `selectionColor` says, so it's nearly
// transparent: above 0.01, UIKit hit-tests it and screen readers reach it.
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
    opacity: 0.011,
  },
})

function OTPInputControl(props: ControlProps) {
  const otp = useHandle(otpInput)
  const { value, selection, focused, readOnly, disabled, formDisabled } =
    otp.state
  const editable = !disabled && !formDisabled && !readOnly
  const { internal } = otp.api
  const views = useContext(ViewsContext)
  const field = useRef<HostInstance>(null)
  // A tap on the unfocused field selects its slot once the press ends, so a
  // scroll that starts on the code doesn't focus it.
  const pressed = useRef<number>(undefined)
  return usePart(
    otp,
    "control",
    {},
    mergeProps(useFieldControl(props, otp.api.focus), {
      value,
      selection: focused ? selection : undefined,
      editable,
      caretHidden: true,
      selectionColor: "transparent",
      underlineColorAndroid: "transparent",
      style: hidden.control,
      onChangeText: (text: string) =>
        withSource("keyboard", () => internal.typeText(text)),
      onSelectionChange: ({ nativeEvent }: TextInputSelectionChangeEvent) =>
        internal.selectText(nativeEvent.selection),
      onPressIn: ({ nativeEvent }: GestureResponderEvent) => {
        pressed.current = slotAt(views, field.current, nativeEvent.locationX)
        if (focused && pressed.current !== undefined) {
          internal.pressSlot(pressed.current)
          pressed.current = undefined
        }
      },
      // Without it, Pressability presses after a long press, and selecting a
      // slot then would close the Paste menu.
      onLongPress: () => {
        pressed.current = undefined
      },
      onPress: () => {
        if (pressed.current !== undefined) {
          internal.pressSlot(pressed.current)
        }
        pressed.current = undefined
      },
      onFocus: () => internal.focusText(true),
      onBlur: () => internal.focusText(false),
      // Android enables a read-only TextInput, which then takes typing, when
      // its disabled state is false.
      accessibilityState: { disabled: !editable },
      ref: field,
    }),
    TextInput
  )
}

/**
 * Holds the slots, and one `TextInput` over them that takes focus, holds the
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
  const views = useRef<Views>({ root: null, slots: new Map() }).current
  const rootRef = useCallback(
    (view: HostInstance | null) => {
      views.root = view
    },
    [views]
  )
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
  const root = usePart(
    otp,
    "root",
    {},
    mergeProps(props as Record<string, unknown>, {
      children: (state: OTPInputState, interaction: Interaction) => (
        <>
          {typeof children === "function"
            ? children(state, interaction)
            : children}
          {control}
        </>
      ),
      ref: rootRef,
    }),
    View
  )
  return <ViewsContext.Provider value={views}>{root}</ViewsContext.Provider>
}

/**
 * Lays out a run of slots. Like them, it's only drawn.
 * @experimental
 */
const OTPInputGroup: OTPInputParts["Group"] = parts.Group

const char = (slot: OTPInputSlotState) =>
  slot.char === null ? null : <Text>{slot.char}</Text>

/**
 * One character of the code, drawn under the field. A tap over it selects it.
 * Without children, it shows the character in a `Text`.
 * @experimental
 */
function OTPInputSlot({
  index,
  children = char,
  ...props
}: OTPInputSlotProps & PartProps<typeof View, OTPInputSlotState>) {
  const otp = useHandle(otpInput)
  const { slots } = useContext(ViewsContext)
  const ref = useCallback(
    (view: HostInstance | null) => {
      if (view) {
        slots.set(index, view)
        return () => {
          slots.delete(index)
        }
      }
    },
    [slots, index]
  )
  return usePart(
    otp,
    "slot",
    { index, id: String(index) },
    mergeProps(
      { accessible: false, focusable: false },
      { ...props, children },
      { ref }
    ),
    View
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
