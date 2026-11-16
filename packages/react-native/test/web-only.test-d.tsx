import { checkboxGroup } from "@ui-sdk/core/checkbox"
import { combobox } from "@ui-sdk/core/combobox"
import { dialog as dialogPrimitive } from "@ui-sdk/core/dialog"
import { radioGroup } from "@ui-sdk/core/radio"
import { rating } from "@ui-sdk/core/rating"
import { segmentedControl } from "@ui-sdk/core/segmented-control"
import { select } from "@ui-sdk/core/select"
import { switchPrimitive } from "@ui-sdk/core/switch"
import { Pressable, TextInput, View } from "react-native"
import { Checkbox, CheckboxGroup, CheckboxIndicator } from "../src/checkbox"
import { Field, FieldError, FieldLabel } from "../src/field"
import { createParts, usePart, usePrimitive } from "../src/primitive"
import type * as SwitchEntry from "../src/switch"
import { Switch, SwitchThumb } from "../src/switch"

const switches = [
  <Switch
    checked
    defaultChecked
    disabled
    readOnly
    required
    value="on"
    onCheckedChange={() => {}}
  >
    <SwitchThumb />
  </Switch>,
  // @ts-expect-error `name` has no native meaning.
  <Switch name="notifications" />,
  // @ts-expect-error `form` has no native meaning.
  <Switch form="settings" />,
]

// @ts-expect-error The switch has no hidden input on native.
type SwitchInput = typeof SwitchEntry.SwitchInput

// @ts-expect-error The hidden input part can't be given a host.
createParts(switchPrimitive, { root: Pressable, input: View })

// @ts-expect-error A radio's hidden input can't be given a host.
createParts(radioGroup, { item: Pressable, input: View })
// @ts-expect-error A rating's hidden radios can't be given a host.
createParts(rating, { input: View })
// @ts-expect-error A segmented control's hidden radios can't be given a host.
createParts(segmentedControl, { input: View })
// @ts-expect-error A checkbox group's hidden input can't be given a host.
createParts(checkboxGroup, { "group-input": View })
// @ts-expect-error A select's hidden value input can't be given a host.
createParts(select, { "value-input": View })

const { Input: ComboboxInput } = createParts(combobox, {
  input: TextInput,
})

const dialog = createParts(dialogPrimitive, {
  trigger: Pressable,
  content: View,
})

const dialogs = [
  <dialog.Root modal defaultOpen dismissible>
    <dialog.Trigger />
    <dialog.Content initialFocus="title" keepMounted />
  </dialog.Root>,
  // @ts-expect-error `modal="trap-focus"` keeps Tab inside, which the Modal's isolation replaces.
  <dialog.Root modal="trap-focus" />,
  // @ts-expect-error `container` is a DOM element.
  <dialog.Root container={null} />,
  // @ts-expect-error `shortcut` needs key events native views don't get.
  <dialog.Trigger shortcut="mod+k" />,
  // @ts-expect-error `container` is a DOM element.
  <dialog.Content container={null} />,
]

function NativeSwitch() {
  const handle = usePrimitive(switchPrimitive, { disabled: true, value: "on" })
  // @ts-expect-error `name` has no native meaning.
  usePrimitive(switchPrimitive, { name: "notifications" })
  // @ts-expect-error `form` has no native meaning.
  usePrimitive(switchPrimitive, { form: "settings" })
  // @ts-expect-error The switch has no hidden input on native.
  usePart(handle, "input")
  usePart(switchPrimitive, "thumb", {}, { style: { width: 20 } }, View)
  return usePart(handle, "root", {}, { testID: "switch" }, Pressable)
}

function NativeDialog() {
  const handle = usePrimitive(dialogPrimitive, { modal: true })
  // @ts-expect-error `modal="trap-focus"` keeps Tab inside, which the Modal's isolation replaces.
  usePrimitive(dialogPrimitive, { modal: "trap-focus" })
  // @ts-expect-error `container` is a DOM element.
  usePrimitive(dialogPrimitive, { container: null })
  // @ts-expect-error `shortcut` needs key events native views don't get.
  usePart(handle, "trigger", { shortcut: "mod+k" })
  // @ts-expect-error `container` is a DOM element.
  usePart(handle, "content", { container: null })
  return usePart(handle, "content", { initialFocus: "title" })
}

const exits = [
  <Checkbox>
    <CheckboxIndicator
      keepMounted
      onExit={(done) => done()}
      style={(state) => state.endingStyle && { opacity: 0 }}
    />
  </Checkbox>,
  // @ts-expect-error A checkbox has no hidden input on native.
  <Checkbox name="terms" />,
  // @ts-expect-error A part that never leaves takes no `onExit`.
  <SwitchThumb onExit={() => {}} />,
  // @ts-expect-error A group takes part in no form on native.
  <CheckboxGroup name="toppings" />,
]

const fields = [
  <Field disabled invalid>
    <FieldLabel>Email</FieldLabel>
    <FieldError match>Required</FieldError>
    <FieldError match={false}>Never</FieldError>
  </Field>,
  // @ts-expect-error `name` has no native meaning.
  <Field name="email" />,
  // @ts-expect-error Native computes no validity, so no flag shows an error.
  <FieldError match="valueMissing" />,
  // @ts-expect-error Native computes no validity, so nothing is valid.
  <FieldLabel style={(state) => state.valid && {}} />,
  // @ts-expect-error Native has no browser message.
  <FieldError>{(state) => state.message}</FieldError>,
]

export {
  ComboboxInput,
  dialogs,
  exits,
  fields,
  NativeDialog,
  NativeSwitch,
  switches,
  type SwitchInput,
}
