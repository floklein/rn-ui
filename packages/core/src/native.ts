// PROTOTYPE (issue #14). What the native adapter imports beside
// `@ui-sdk/core/renderer`: the host interface it implements, and the reads
// the DOM adapters leave to `bind`.
export { withSource } from "./foundation/kernel/details"
export {
  type NativeBehavior,
  type NativeHost,
  type NativeInput,
  setNativeHost,
} from "./foundation/kernel/native-host"
export { liveAttrs } from "./foundation/kernel/part"
