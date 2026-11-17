import {
  accordion,
  type AccordionPanelState as AccordionPanelCoreState,
  type AccordionPrimitive,
} from "@ui-sdk/core/accordion"
import { accordionNative } from "@ui-sdk/core/native"
import type { PresenceState } from "@ui-sdk/core/renderer"
import * as React from "react"
import { Pressable, View } from "react-native"
import { type PanelSizeState, usePanelSize } from "./disclosure-panel"
import {
  createParts,
  type ExitProps,
  type PartProps,
  type Parts,
  useAround,
  useHandle,
} from "./use-primitive"

type AccordionParts = Parts<
  AccordionPrimitive,
  {
    root: typeof View
    item: typeof View
    header: typeof View
    trigger: typeof Pressable
    panel: typeof View
  }
>

const parts: AccordionParts = createParts(
  accordion,
  { root: View, item: View, header: View, trigger: Pressable, panel: View },
  accordionNative
)

/**
 * The state the panel hands `style`, `className`, `children` and `render`
 * functions: its item's state, its presence flags, and its measured size.
 * @experimental
 */
type AccordionPanelState = AccordionPanelCoreState &
  PresenceState &
  PanelSizeState

/**
 * A stack of items that each open a section of content, in a `View`. One item
 * is open at a time unless `multiple` is set. `T` is inferred from `value`,
 * `defaultValue` or `onValueChange`.
 * @experimental
 */
const Accordion: AccordionParts["Root"] = parts.Root

/**
 * One item, in a `View`: a header with its trigger, and the panel the trigger
 * opens.
 * @experimental
 */
const AccordionItem: AccordionParts["Item"] = parts.Item

/**
 * A `View` around the trigger. It has no heading role: React Native gives an
 * element one role, and the trigger keeps the button's.
 * @experimental
 */
const AccordionHeader: AccordionParts["Header"] = parts.Header

/**
 * The button that opens and closes its item's panel: a `Pressable` with the
 * button role, expanded while the panel is open.
 * @experimental
 */
const AccordionTrigger: AccordionParts["Trigger"] = parts.Trigger

/**
 * The content its item's trigger shows and hides. Closed, it leaves the
 * screen unless `keepMounted` keeps it, hidden. Its state holds the size of
 * its content, laid out in a view of its own, so a style can animate the
 * panel's height to it. Pass `onExit` to keep it mounted while it animates out.
 * @experimental
 */
function AccordionPanel(
  props: PartProps<typeof View, AccordionPanelState> &
    ExitProps & { keepMounted?: boolean; hiddenUntilFound?: boolean }
) {
  const handle = useHandle(accordion)
  const value = useAround(accordion, "item")?.value as string
  const isOpen = React.useCallback(
    () => handle.api.isOpen(value),
    [handle, value]
  )
  return (
    <parts.Panel {...usePanelSize(props, isOpen, handle.instance.subscribe)} />
  )
}

export { createAccordionController } from "@ui-sdk/core/accordion"
export type {
  AccordionApi,
  AccordionChangeOptions,
  AccordionController,
  AccordionHeaderProps,
  AccordionHeaderState,
  AccordionItemProps,
  AccordionItemState,
  AccordionOptions,
  AccordionPanelProps,
  AccordionPrimitive,
  AccordionState,
  AccordionTriggerProps,
  AccordionTriggerState,
  AccordionValueChangeReason,
} from "@ui-sdk/core/accordion"

export {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  type AccordionPanelState,
  AccordionTrigger,
}
