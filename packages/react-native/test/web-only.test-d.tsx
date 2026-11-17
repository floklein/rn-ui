import { checkboxGroup } from "@ui-sdk/core/checkbox"
import { combobox } from "@ui-sdk/core/combobox"
import { dialog as dialogPrimitive } from "@ui-sdk/core/dialog"
import { radioGroup } from "@ui-sdk/core/radio"
import { rating } from "@ui-sdk/core/rating"
import { segmentedControl } from "@ui-sdk/core/segmented-control"
import { select } from "@ui-sdk/core/select"
import { switchPrimitive } from "@ui-sdk/core/switch"
import { Pressable, TextInput, View } from "react-native"
import { AlertDialog } from "../src/alert-dialog"
import { Checkbox, CheckboxGroup, CheckboxIndicator } from "../src/checkbox"
import { Dialog, DialogContent, DialogTrigger } from "../src/dialog"
import type * as DialogEntry from "../src/dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "../src/drawer"
import type * as DrawerEntry from "../src/drawer"
import { Field, FieldError, FieldLabel } from "../src/field"
import { FileInput, FileInputTrigger } from "../src/file-input"
import type * as FileInputEntry from "../src/file-input"
import { OTPInput } from "../src/otp-input"
import { Pagination } from "../src/pagination"
import { PasswordInput, PasswordInputControl } from "../src/password-input"
import { createParts, usePart, usePrimitive } from "../src/primitive"
import { Radio, RadioGroup, RadioIndicator } from "../src/radio"
import {
  SegmentedControl,
  SegmentedControlItem,
} from "../src/segmented-control"
import type * as SwitchEntry from "../src/switch"
import { Switch, SwitchThumb } from "../src/switch"
import { Toggle } from "../src/toggle"

const values = [
  <Checkbox value="terms" />,
  <Radio value="small" />,
  <Toggle value="bold" />,
]

const switches = [
  <Switch
    checked
    defaultChecked
    disabled
    readOnly
    required
    onCheckedChange={() => {}}
  >
    <SwitchThumb />
  </Switch>,
  // @ts-expect-error A switch submits no value on native.
  <Switch value="on" />,
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
  <RadioGroup>
    <Radio value="small">
      <RadioIndicator onExit={(done) => done()} />
    </Radio>
  </RadioGroup>,
  // @ts-expect-error A radio group takes part in no form on native.
  <RadioGroup name="size" />,
  // @ts-expect-error A radio group takes part in no form on native.
  <RadioGroup form="order" />,
  <SegmentedControl defaultValue="list">
    <SegmentedControlItem value="list" />
  </SegmentedControl>,
  // @ts-expect-error A segmented control takes part in no form on native.
  <SegmentedControl name="view" />,
  // @ts-expect-error A segmented control takes part in no form on native.
  <SegmentedControl form="settings" />,
]

const passwords = [
  <PasswordInput autoComplete="new-password" defaultVisible required>
    <PasswordInputControl placeholder="Password" />
  </PasswordInput>,
  // @ts-expect-error `name` has no native meaning.
  <PasswordInput name="password" />,
  // @ts-expect-error `form` has no native meaning.
  <PasswordInput form="sign-in" />,
  // @ts-expect-error The control's secure entry follows the root's `visible`.
  <PasswordInputControl secureTextEntry={false} />,
]

const codes = [
  <OTPInput aria-label="Code" maxLength={4} pattern="alphanumeric" required />,
  // @ts-expect-error `name` has no native meaning.
  <OTPInput name="code" />,
  // @ts-expect-error `form` has no native meaning.
  <OTPInput form="verify" />,
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

const dialogEntries = [
  <Dialog modal={false} />,
  // @ts-expect-error `modal="trap-focus"` keeps Tab inside, which the Modal's isolation replaces.
  <Dialog modal="trap-focus" />,
  // @ts-expect-error `container` is a DOM element.
  <Dialog container={null} />,
  // @ts-expect-error `container` is a DOM element.
  <DialogContent container={null} />,
  // @ts-expect-error Keyboard shortcuts are web-only.
  <DialogTrigger shortcut="mod+k" />,
  // @ts-expect-error `container` is a DOM element.
  <AlertDialog container={null} />,
  // @ts-expect-error An alert dialog is always modal.
  <AlertDialog modal={false} />,
]

// @ts-expect-error The shortcut part is web-only.
type DialogShortcut = typeof DialogEntry.DialogShortcut

const drawers = [
  <Drawer modal={false} snapPoints={[0.5, 1]} modalAbove={0.5} />,
  // @ts-expect-error `modal="trap-focus"` keeps Tab inside, which the Modal's isolation replaces.
  <Drawer modal="trap-focus" />,
  // @ts-expect-error `container` is a DOM element.
  <Drawer container={null} />,
  // @ts-expect-error The scroll-snap driver is the browser's scrolling.
  <Drawer driver="scroll-snap" />,
  // @ts-expect-error The theme color is a web page's.
  <Drawer themeColor />,
  // @ts-expect-error The edge swipe is iOS Safari's.
  <Drawer preventEdgeSwipe />,
  // @ts-expect-error `container` is a DOM element.
  <DrawerContent container={null} />,
  // @ts-expect-error Keyboard shortcuts are web-only.
  <DrawerTrigger shortcut="mod+k" />,
]

// @ts-expect-error The shortcut part is web-only.
type DrawerShortcut = typeof DrawerEntry.DrawerShortcut

const paginations = [
  <Pagination pageCount={10} onPageChange={() => {}} />,
  // @ts-expect-error Pages are buttons on native, with no URL to link to.
  <Pagination pageCount={10} getHref={(page) => `/posts/${page}`} />,
]

const files = [
  <FileInput
    multiple
    accept="image/*"
    pick={async ({ accept, multiple }) =>
      multiple && accept.length
        ? [{ name: "a.png", size: 1, type: "image/png", uri: "file:///a.png" }]
        : null
    }
    onValueChange={(value) => value[0]?.uri}
  >
    <FileInputTrigger />
  </FileInput>,
  // @ts-expect-error A picked file carries its uri.
  <FileInput pick={() => [{ name: "a.png", size: 1, type: "image/png" }]} />,
  // @ts-expect-error `name` has no native meaning.
  <FileInput name="attachments" />,
  // @ts-expect-error The app's pick decides which picker opens.
  <FileInput directory />,
  // @ts-expect-error The app's pick decides whether the camera opens.
  <FileInput capture="environment" />,
]

// @ts-expect-error The file input has no hidden input on native.
type FileInputHiddenInput = typeof FileInputEntry.FileInputInput

export {
  codes,
  ComboboxInput,
  dialogEntries,
  type DialogShortcut,
  dialogs,
  drawers,
  type DrawerShortcut,
  exits,
  fields,
  type FileInputHiddenInput,
  files,
  NativeDialog,
  NativeSwitch,
  paginations,
  passwords,
  switches,
  type SwitchInput,
  values,
}
