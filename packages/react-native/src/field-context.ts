import type { FieldPrimitive } from "@ui-sdk/core/field"
import { attrs } from "@ui-sdk/core/renderer"
import * as React from "react"
import { useLabel } from "./names"
import { controls, controlsById } from "./native-host"
import { DisabledContext, type PrimitiveHandle } from "./use-primitive"

const FieldContext =
  React.createContext<PrimitiveHandle<FieldPrimitive> | null>(null)

const noop = () => () => {}
const none = () => undefined

/** Whether a disabled Field or FieldSet around the component disables it. */
const useInheritedDisabled = () =>
  React.useContext(DisabledContext)?.disabled ?? false

function useActivation<Key>(
  registry: {
    get: (key: Key) => (() => void) | undefined
    set: (key: Key, run: () => void) => unknown
    delete: (key: Key) => unknown
  },
  key: Key | null | undefined,
  activate: () => void
) {
  const latest = React.useRef(activate)
  latest.current = activate
  React.useLayoutEffect(() => {
    if (key == null) {
      return
    }
    const run = () => latest.current()
    registry.set(key, run)
    return () => {
      if (registry.get(key) === run) {
        registry.delete(key)
      }
    }
  }, [registry, key])
}

// What a press on the nearest Field's label does.
const useLabelPress = (
  field: PrimitiveHandle<FieldPrimitive> | null,
  activate: () => void
) => useActivation(controls, field?.api, activate)

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
  useActivation(controlsById, id, activate)
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
