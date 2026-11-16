import type { NativeBehavior } from "../../foundation/kernel/native-host"
import { attrs } from "../../foundation/kernel/part"
import type { Part } from "../../foundation/kernel/primitive-types"
import type { FieldApi } from "./field"

const register =
  (list: "labels" | "descriptions" | "errors") => (part: Part<any, FieldApi>) =>
    part.api.internal.register(list, attrs(part).id as string)

/**
 * Field's behavior on the native host. Its label, description and error
 * parts register their ids while mounted, as their `bind` does on the DOM
 * host, so the control points only at the parts that render.
 * @experimental
 */
const fieldNative: NativeBehavior<FieldApi> = {
  root: (part) => {
    queueMicrotask(() => part.store.set({ bound: true }))
  },
  label: register("labels"),
  description: register("descriptions"),
  error: register("errors"),
}

export { fieldNative }
