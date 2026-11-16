import type { FieldPrimitive } from "@ui-sdk/core/field"
import { attrs } from "@ui-sdk/core/renderer"
import * as React from "react"
import { controls } from "./native-host"
import { DisabledContext, type PrimitiveHandle } from "./use-primitive"

const FieldContext =
  React.createContext<PrimitiveHandle<FieldPrimitive> | null>(null)

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

/**
 * A control inside a Field: its props with the field's label and
 * descriptions, its own description first. `activate` is what a press on the
 * field's label does. Outside a Field, the props as they are.
 */
function useFieldControl<Props extends Record<string, unknown>>(
  props: Props,
  activate: () => void
) {
  const field = React.useContext(FieldContext)
  useLabelPress(field, activate)
  React.useSyncExternalStore(
    field ? field.instance.subscribe : noop,
    field ? field.instance.get : none,
    field ? field.instance.get : none
  )
  if (!field) {
    return props
  }
  const part = field.instance.part("control", {
    describedBy: props["aria-describedby"] as string | undefined,
  })
  const own = attrs(part)
  return {
    ...props,
    "aria-labelledby": props["aria-labelledby"] ?? own["aria-labelledby"],
    "aria-describedby": own["aria-describedby"],
  }
}

export { FieldContext, useFieldControl, useInheritedDisabled, useLabelPress }
