import type { FieldPrimitive } from "@ui-sdk/core/field"
import { attrs } from "@ui-sdk/core/renderer"
import * as React from "react"
import { carry } from "./carried-context"
import { useLabel } from "./names"
import { controls, controlsById } from "./native-host"
import { DisabledContext, type PrimitiveHandle } from "./use-primitive"

const FieldContext = carry(
  "Field",
  React.createContext<PrimitiveHandle<FieldPrimitive> | null>(null)
)

const noop = () => () => {}
const none = () => undefined

/** Whether a disabled Field or FieldSet around the component disables it. */
const useInheritedDisabled = () =>
  React.useContext(DisabledContext)?.disabled ?? false

// What a press on the nearest Field's label does.
function useLabelPress(
  field: PrimitiveHandle<FieldPrimitive> | null,
  activate: () => void
) {
  const latest = React.useRef(activate)
  latest.current = activate
  React.useLayoutEffect(() => {
    if (!field) {
      return
    }
    const run = () => latest.current()
    controls.set(field.api, run)
    return () => {
      if (controls.get(field.api) === run) {
        controls.delete(field.api)
      }
    }
  }, [field])
}

// What a press on a Label for the control's id does. Two screens may hold the
// same id: the control mounted last is pressed.
function useLabelTarget(id: string | undefined, activate: () => void) {
  const latest = React.useRef(activate)
  latest.current = activate
  React.useLayoutEffect(() => {
    if (id === undefined) {
      return
    }
    const run = () => latest.current()
    controlsById.set(id, [...(controlsById.get(id) ?? []), run])
    return () => {
      const rest = controlsById.get(id)!.filter((other) => other !== run)
      if (rest.length) {
        controlsById.set(id, rest)
      } else {
        controlsById.delete(id)
      }
    }
  }, [id])
}

/**
 * A control inside a Field: its props with the field's label and
 * descriptions, its own description first. `activate` is what a press on the
 * field's label, or on a Label for its id, does. Outside a Field, named by
 * the Label for its id unless it has a name of its own.
 */
function useFieldControl<Props extends Record<string, unknown>>(
  props: Props,
  activate: () => void
) {
  const field = React.useContext(FieldContext)
  useLabelPress(field, activate)
  const id = (props.id ?? props.nativeID) as string | undefined
  useLabelTarget(id, activate)
  const label = useLabel(id)
  React.useSyncExternalStore(
    field ? field.instance.subscribe : noop,
    field ? field.instance.get : none,
    field ? field.instance.get : none
  )
  if (!field) {
    return props["aria-label"] || props["aria-labelledby"]
      ? props
      : { ...props, "aria-labelledby": label }
  }
  const part = field.instance.part("control", {
    describedBy: props["aria-describedby"] as string | undefined,
  })
  const own = attrs(part)
  return {
    ...props,
    "aria-labelledby":
      props["aria-labelledby"] ?? own["aria-labelledby"] ?? label,
    "aria-describedby": own["aria-describedby"],
  }
}

export { FieldContext, useFieldControl, useInheritedDisabled, useLabelPress }
