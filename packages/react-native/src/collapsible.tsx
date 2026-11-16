import {
  collapsible,
  type CollapsiblePanelState as CollapsiblePanelCoreState,
  type CollapsiblePrimitive,
} from "@ui-sdk/core/collapsible"
import { collapsibleNative } from "@ui-sdk/core/native"
import type { PresenceState } from "@ui-sdk/core/renderer"
import { Pressable, View } from "react-native"
import { type PanelSizeState, usePanelSize } from "./disclosure-panel"
import {
  createParts,
  type ExitProps,
  type PartProps,
  type Parts,
  useHandle,
} from "./use-primitive"

type CollapsibleParts = Parts<
  CollapsiblePrimitive,
  { root: typeof View; trigger: typeof Pressable; panel: typeof View }
>

const parts: CollapsibleParts = createParts(
  collapsible,
  { root: View, trigger: Pressable, panel: View },
  collapsibleNative
)

/**
 * The state the panel hands `style`, `className`, `children` and `render`
 * functions: whether it's open, its presence flags, and its measured size.
 * @experimental
 */
type CollapsiblePanelState = CollapsiblePanelCoreState &
  PresenceState &
  PanelSizeState

/**
 * A panel of content that a button shows and hides, in a `View`. Put its
 * trigger and panel inside.
 * @experimental
 */
const Collapsible: CollapsibleParts["Root"] = parts.Root

/**
 * The button that opens and closes the panel: a `Pressable` with the button
 * role, expanded while the panel is open.
 * @experimental
 */
const CollapsibleTrigger: CollapsibleParts["Trigger"] = parts.Trigger

/**
 * The content the trigger shows and hides. Closed, it leaves the screen
 * unless `keepMounted` keeps it, hidden. Its state holds the size of its
 * content, laid out in a view of its own, so a style can animate the panel's
 * height to it. Pass `onExit` to keep it mounted while it animates out.
 * @experimental
 */
function CollapsiblePanel(
  props: PartProps<typeof View, CollapsiblePanelState> &
    ExitProps & { keepMounted?: boolean; hiddenUntilFound?: boolean }
) {
  const handle = useHandle(collapsible)
  return (
    <parts.Panel
      {...usePanelSize(props, handle.api.isOpen, handle.instance.subscribe)}
    />
  )
}

export { createCollapsibleController } from "@ui-sdk/core/collapsible"
export type {
  CollapsibleApi,
  CollapsibleChangeOptions,
  CollapsibleController,
  CollapsibleOpenChangeReason,
  CollapsibleOptions,
  CollapsiblePanelProps,
  CollapsiblePrimitive,
  CollapsibleState,
  CollapsibleTriggerProps,
  CollapsibleTriggerState,
} from "@ui-sdk/core/collapsible"

export {
  Collapsible,
  CollapsiblePanel,
  type CollapsiblePanelState,
  CollapsibleTrigger,
}
