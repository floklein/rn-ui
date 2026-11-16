import { separator, type SeparatorPrimitive } from "@ui-sdk/core/separator"
import { View } from "react-native"
import { createParts, type Parts } from "./use-primitive"

type SeparatorParts = Parts<SeparatorPrimitive, { root: typeof View }>

const parts: SeparatorParts = createParts(separator, { root: View })

/**
 * A line between groups of content: a `View` that no screen reader or
 * keyboard stops on, since neither OS announces a separator role.
 * @experimental
 */
const Separator: SeparatorParts["Root"] = parts.Root

export type {
  SeparatorOptions,
  SeparatorOrientation,
  SeparatorPrimitive,
  SeparatorState,
} from "@ui-sdk/core/separator"

export { Separator }
