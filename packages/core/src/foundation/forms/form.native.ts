import type { Twin } from "../kernel/twin"
import type { bindElementInternals } from "./form-internals"
import type * as Mirrored from "./form"
import type * as Native from "./form.native"

// No form to take part in: the app reads values from change callbacks, and
// a disabled FieldSet hands its state down through the adapter. Focus
// registration and the disabled checks behave as on the web.

type InternalsBinder = typeof bindElementInternals

type FormValue = string | string[] | FormData | null

type Association = {
  reset: () => void
  disabled: (disabled: boolean) => void
}

const none = () => {}
const unbound = () => none

const focusOf = new WeakMap<HTMLElement, () => void>()

function focusWith(el: HTMLElement, focus: () => void) {
  focusOf.set(el, focus)
  return () => {
    if (focusOf.get(el) === focus) {
      focusOf.delete(el)
    }
  }
}

function focusControl(el: HTMLElement) {
  const focus = focusOf.get(el)
  if (focus) {
    focus()
  } else {
    el.focus()
  }
}

// With no form, the claim is the whole screen's until the next task.
const screen = {}
const focusing = new WeakSet<object>()
function claimInvalidFocus(
  el: HTMLElement,
  form: HTMLFormElement | null | undefined
) {
  const owner = form ?? screen
  if (focusing.has(owner)) {
    return
  }
  focusing.add(owner)
  setTimeout(() => focusing.delete(owner))
  focusControl(el)
}

const invalidFocusClaimed = (
  _el: HTMLElement,
  form: HTMLFormElement | null | undefined
) => focusing.has(form ?? screen)

const attachFormInternals = (
  _el: HTMLElement,
  _internals: ElementInternals,
  _bind: InternalsBinder
) => {}

const formInternals = (_el: HTMLElement | undefined) =>
  undefined as ElementInternals | undefined

const valueMissingMessage = (
  _type: "checkbox" | "radio" | "select" | "file" | "text"
) => ""

const validityChanged = (_el: HTMLElement) => {}

const onValidityChange = (_listener: (el: HTMLElement) => void) => none

const setComponentValidity = (_el: HTMLInputElement, _message: string) => {}

const submitImplicitly = (_form: HTMLFormElement | null | undefined) => {}

const dispatchChange = (
  _el: HTMLElement | undefined,
  _types: readonly ("input" | "change")[] = ["input", "change"]
) => {}

const fieldsetDisabled = (_el: Element) => false

const hiddenInputStyle =
  "position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;opacity:0;pointer-events:none"

const associate = (
  _input: HTMLInputElement,
  _options: Association & { focus: () => void; write: () => void }
) => none

const watchFieldsets = (_el: Element, _onChange: (disabled: boolean) => void) =>
  none

const elementMoved = (_el: Element) => undefined as void | undefined

const isDisabled = (state: { disabled: boolean; formDisabled: boolean }) =>
  state.disabled || state.formDisabled

const watchFormDisabled = (
  _el: Element,
  _store: { set: (patch: { formDisabled: boolean }) => void }
) => none

// A stand-in from a native behavior file answers neither.
const isDisabledElement = (el: Element) =>
  !!el.matches?.(":disabled") || el.getAttribute?.("aria-disabled") === "true"

const bindHiddenInput = unbound as (
  input: HTMLInputElement,
  options: Association & {
    checked: () => boolean
    indeterminate?: () => boolean
    subscribe: (listener: () => void) => () => void
    focus: () => void
    control?: () => HTMLElement | undefined
    activate?: (event: Event) => void
  }
) => () => void

const bindValueInput = unbound as (
  input: HTMLInputElement,
  options: Association & {
    value: () => string
    subscribe: (listener: () => void) => () => void
    focus: () => void
    autofill?: (value: string) => void
  }
) => () => void

const bindInternals = unbound as (
  el: HTMLElement,
  options: Parameters<InternalsBinder>[2]
) => () => void

const fieldControlId = (fieldId: string) => `${fieldId}-control`

const isLabelable = (_el: HTMLElement) => false

const nameFromLabels = (_el: HTMLElement, _target?: HTMLElement) => none

const labelsOf = (_el: HTMLElement) => [] as HTMLLabelElement[]

const labelledBy = (
  _el: HTMLElement,
  _findLabels: () => HTMLElement[],
  _watch?: HTMLElement
) => none

true satisfies Twin<typeof Mirrored, typeof Native>

export {
  associate,
  type Association,
  attachFormInternals,
  bindHiddenInput,
  bindInternals,
  bindValueInput,
  claimInvalidFocus,
  dispatchChange,
  elementMoved,
  fieldControlId,
  fieldsetDisabled,
  focusWith,
  formInternals,
  type FormValue,
  hiddenInputStyle,
  invalidFocusClaimed,
  isDisabled,
  isDisabledElement,
  isLabelable,
  labelledBy,
  labelsOf,
  nameFromLabels,
  onValidityChange,
  setComponentValidity,
  submitImplicitly,
  validityChanged,
  valueMissingMessage,
  watchFieldsets,
  watchFormDisabled,
}
