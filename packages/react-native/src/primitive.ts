// PROTOTYPE (issue #14). Helpers for building native parts on the primitives
// the components use, with the names `@ui-sdk/react/primitive` exports.
// `traceHost` is the prototype's own: it shows what the host was asked.
export { type HostRequest, traceHost } from "./native-host"
export {
  type Interaction,
  mergeProps,
  renderElement,
  type RenderProp,
} from "./render-element"
export {
  createParts,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"
