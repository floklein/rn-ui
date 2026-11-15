// Helpers for building native parts on the same primitives the components
// use, with the names `@ui-sdk/react/primitive` exports.
export {
  type Interaction,
  mergeProps,
  renderElement,
  type RenderProp,
} from "./render-element"
export {
  createParts,
  type GenericPartComponent,
  type PartComponent,
  usePart,
  usePrimitive,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
} from "./use-primitive"
