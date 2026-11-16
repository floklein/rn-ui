import {
  fieldGroup,
  field as fieldPrimitive,
  fieldSet,
  type FieldDescriptionState as CoreFieldDescriptionState,
  type FieldErrorState as CoreFieldErrorState,
  type FieldOptions as CoreFieldOptions,
  type FieldSetOptions,
  type FieldSetState,
  type FieldState as CoreFieldState,
} from "@ui-sdk/core/field"
import { fieldNative, nativeHost } from "@ui-sdk/core/native"
import { fieldOutsideState } from "@ui-sdk/core/renderer"
import * as React from "react"
import { Text, TextInput, View } from "react-native"
import {
  FieldContext,
  useInheritedDisabled,
  useLabelPress,
} from "./field-context"
import { carry } from "./carried-context"
import { textOf, useReferences } from "./names"
import { mergeProps, renderElement } from "./render-element"
import {
  DisabledContext,
  type PartProps,
  type PrimitiveHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

/**
 * The options Field takes. Native computes no validity, so the field is
 * invalid only when you pass `invalid`.
 * @experimental
 */
type FieldOptions = Omit<CoreFieldOptions, "name">

/**
 * What Field's parts hand `style`, `className`, `children` and `render` functions.
 * @experimental
 */
type FieldState = Omit<CoreFieldState, "valid">

/**
 * What a FieldDescription hands its functions: its Field's state, or only
 * `disabled` when it describes a FieldSet.
 * @experimental
 */
type FieldDescriptionState = Omit<CoreFieldDescriptionState, "valid">

/**
 * What a FieldError hands its functions.
 * @experimental
 */
type FieldErrorState = Omit<CoreFieldErrorState, "valid" | "message">

/**
 * The props FieldError takes.
 * @experimental
 */
type FieldErrorProps = {
  /** `true` shows the error whatever `invalid` is, `false` never. Without it, it shows while the field is invalid. */
  match?: boolean
}

type FieldHandle = PrimitiveHandle<typeof fieldPrimitive>
type FieldSetHandle = PrimitiveHandle<typeof fieldSet>

const DescribedContext = carry(
  "Described",
  React.createContext<FieldHandle | FieldSetHandle | null>(null)
)

type FieldSlot = "label" | "description" | "error" | "control"

// A part inside its field, as a component of its own, so whether a field is
// around a part never changes the order of its hooks.
function InField({
  field,
  slot,
  part,
  props,
  host,
}: {
  field: FieldHandle
  slot: FieldSlot
  part: Record<string, unknown>
  props: Record<string, any>
  host: React.ElementType
}) {
  return usePart(field, slot, part as never, props, host)
}

// Errors that appear or change while the person stays where they are are
// said, but not those of the first render, which the screen reads.
function useAnnouncedErrors(field: FieldHandle) {
  const { errors } = field.state
  useReferences(errors)
  const said = React.useRef(new Map<string, string>())
  const quiet = React.useRef(true)
  React.useEffect(() => {
    const timer = setTimeout(() => (quiet.current = false))
    return () => clearTimeout(timer)
  }, [])
  React.useEffect(() => {
    const next = new Map<string, string>()
    for (const id of errors) {
      const text = textOf(id)
      if (text === undefined) {
        continue
      }
      next.set(id, text)
      if (!quiet.current && said.current.get(id) !== text) {
        nativeHost()?.announce(text, "polite")
      }
    }
    said.current = next
  })
}

/**
 * Ties a control to its label, description and error messages: a `View`.
 * Its label names the control and starts editing or presses it.
 * @experimental
 */
function Field({
  disabled,
  invalid,
  debug,
  ...props
}: FieldOptions & PartProps<typeof View, FieldState>) {
  const field = usePrimitive(
    fieldPrimitive,
    { disabled, invalid, debug },
    fieldNative
  )
  useAnnouncedErrors(field)
  const off = field.api.disabled()
  const around = React.useMemo(
    () => ({ disabled: off, owner: field.instance }),
    [off, field]
  )
  return (
    <FieldContext value={field}>
      <DescribedContext value={field}>
        <DisabledContext value={around}>
          {usePart(field, "root", {}, props as Record<string, unknown>, View)}
        </DisabledContext>
      </DescribedContext>
    </FieldContext>
  )
}

/**
 * Names the field's control, from its plain text: a `Text`. A press starts
 * editing the control, or presses it. Outside a Field, it's plain text.
 * @experimental
 */
function FieldLabel({ render, ...props }: PartProps<typeof Text, FieldState>) {
  const field = React.useContext(FieldContext)
  if (!field) {
    return renderElement(Text, props, render, fieldOutsideState as FieldState)
  }
  return (
    <InField
      field={field}
      slot="label"
      part={{ id: props.id }}
      props={{ ...props, render }}
      host={Text}
    />
  )
}

/**
 * Describes its Field's control, from its plain text: a `Text`. Right inside
 * a FieldSet, outside any Field, it describes the group.
 * @experimental
 */
function FieldDescription({
  render,
  ...props
}: PartProps<typeof Text, FieldDescriptionState>) {
  const described = React.useContext(DescribedContext)
  if (!described) {
    return renderElement(
      Text,
      props,
      render,
      fieldOutsideState as FieldDescriptionState
    )
  }
  return (
    <InField
      field={described as FieldHandle}
      slot="description"
      part={{ id: props.id }}
      props={{ ...props, render }}
      host={Text}
    />
  )
}

/**
 * An error message: a `Text`, shown while the field is invalid, or as
 * `match` says. Its plain text describes the control, and it's announced
 * when it appears or changes.
 * @experimental
 */
function FieldError({
  match,
  render,
  ...props
}: PartProps<typeof Text, FieldErrorState> & FieldErrorProps) {
  const field = React.useContext(FieldContext)
  const made = React.useId()
  if (!field) {
    return match === true
      ? renderElement(Text, props, render, fieldOutsideState as FieldErrorState)
      : null
  }
  // Only an error with `match` needs an id of its own.
  const id = props.id ?? (match === undefined ? undefined : made)
  return (
    <InField
      field={field}
      slot="error"
      part={{ id, match }}
      props={{ ...props, render }}
      host={Text}
    />
  )
}

/**
 * A plain `TextInput` the field's label names, for a field without one of
 * the library's controls.
 * @experimental
 */
function FieldControl({
  render,
  ...props
}: PartProps<typeof TextInput, FieldState>) {
  const field = React.useContext(FieldContext)
  const disabled = useInheritedDisabled()
  useLabelPress(field, () => {
    if (field) {
      nativeHost()?.focus(field.instance.part("control"))
    }
  })
  if (!field) {
    return renderElement(
      TextInput,
      props,
      render,
      fieldOutsideState as FieldState
    )
  }
  // The field puts the control's own description ahead of its own.
  const { "aria-describedby": describedBy, ...rest } = props as typeof props & {
    "aria-describedby"?: string
  }
  return (
    <InField
      field={field}
      slot="control"
      part={{ id: props.id, describedBy }}
      props={mergeProps(rest, {
        editable: !disabled,
        accessibilityState: { disabled, ...rest.accessibilityState },
        render,
      })}
      host={TextInput}
    />
  )
}

/**
 * Groups related fields under a legend: a `View`. `disabled` disables every
 * Field and control inside it, and a disabled FieldSet around it disables it.
 * @experimental
 */
function FieldSet({
  disabled,
  debug,
  ...props
}: FieldSetOptions & PartProps<typeof View, FieldSetState>) {
  const outer = useInheritedDisabled()
  const set = usePrimitive(fieldSet, { disabled: disabled || outer, debug })
  const off = set.state.disabled
  const around = React.useMemo(
    () => ({ disabled: off, owner: set.instance }),
    [off, set]
  )
  return (
    <DescribedContext value={set}>
      <DisabledContext value={around}>
        {usePart(set, "set", {}, props as Record<string, unknown>, View)}
      </DisabledContext>
    </DescribedContext>
  )
}

/**
 * The field set's title: a `Text`.
 * @experimental
 */
function FieldLegend(props: PartProps<typeof Text, FieldSetState>) {
  return usePart(
    fieldSet,
    "legend",
    { id: props.id },
    props as Record<string, unknown>,
    Text
  )
}

/**
 * Lays fields out: a `View` with no role and no state.
 * @experimental
 */
function FieldGroup(props: PartProps<typeof View>) {
  return usePart(
    usePrimitive(fieldGroup, {}),
    "group",
    {},
    props as Record<string, unknown>,
    View
  )
}

export {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  type FieldDescriptionState,
  type FieldErrorProps,
  type FieldErrorState,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  type FieldOptions,
  FieldSet,
  type FieldState,
}
export type {
  FieldApi,
  FieldGroupPrimitive,
  FieldPrimitive,
  FieldSetOptions,
  FieldSetPrimitive,
  FieldSetState,
} from "@ui-sdk/core/field"
