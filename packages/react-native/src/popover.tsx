import { popoverNative } from "@ui-sdk/core/native"
import {
  popover,
  type PopoverArrowState,
  type PopoverContentProps,
  type PopoverContentState,
  type PopoverController,
  type PopoverOptions,
  type PopoverTriggerProps,
  type PopoverTriggerState,
} from "@ui-sdk/core/popover"
import type { PresenceState } from "@ui-sdk/core/renderer"
import * as React from "react"
import { Pressable, Text, View } from "react-native"
import { useControllerEntry } from "./controller-target"
import { layerInput } from "./native-host"
import { landIn, useHost } from "./overlay-host"
import {
  fromLeft,
  type NativeAnchor,
  placementOf,
  usePlaced,
  usePlacement,
} from "./placement"
import {
  createOutlet,
  OutletContext,
  PopupLayer,
  popupTrigger,
  useOutlet,
} from "./popup-parts"
import { mergeProps, withState } from "./render-element"
import {
  createParts,
  type ExitProps,
  HandleScope,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  useHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

/**
 * The fields placement adds to the content's state, as the web's CSS
 * variables and data attributes. Undefined until it's first placed.
 * @experimental
 */
type PopoverPlacementState = {
  /** The side it opened on, after flipping. */
  side?: "top" | "right" | "bottom" | "left"
  /** How it lines up with the anchor. */
  align?: "start" | "center" | "end"
  /** The width of the trigger, or of the anchor it's placed against. */
  anchorWidth?: number
  /** The height of the trigger, or of the anchor it's placed against. */
  anchorHeight?: number
  /** The width it has before reaching the edge of the space it may use. */
  availableWidth?: number
  /** The height it has before reaching the edge of the space it may use. */
  availableHeight?: number
  /** The point facing the anchor, as a `transformOrigin` style, like `"100px 0px"`. */
  transformOrigin?: string
  /** Where the anchor's center falls along the edge facing it, kept clear of the corners. */
  arrowOffset?: number
}

/**
 * The fields placement adds to the arrow's state.
 * @experimental
 */
type PopoverArrowPlacementState = {
  /** The side the popover opened on. */
  side?: "top" | "right" | "bottom" | "left"
  /** How the popover lines up with the anchor. */
  align?: "start" | "center" | "end"
  /** Whether the arrow stopped short of the anchor's center at a corner. */
  arrowClamped?: boolean
}

/**
 * The props of `Popover`.
 * @experimental
 */
type PopoverProps = Omit<
  PopoverOptions,
  "container" | "modal" | "openOnHover" | "delay" | "closeDelay"
> & {
  /**
   * `true` renders the popover in a `Modal`, which hides the rest of the
   * screen from screen readers, and a press outside closes it. `false`
   * renders it in the app's `OverlayHost`, and a press outside closes it and
   * reaches what's under it.
   * @defaultValue false
   */
  modal?: boolean
  children?: React.ReactNode
}

type TriggerPartProps = PartProps<typeof Pressable, PopoverTriggerState> &
  Omit<PopoverTriggerProps, "controller" | "shortcut"> & {
    /** Connects a trigger outside the popover, like one per row, to the popover with this controller. */
    controller?: PopoverController<any>
  }

type ContentPartProps = PartProps<
  typeof View,
  PopoverContentState & PresenceState & PopoverPlacementState
> &
  Omit<PopoverContentProps, "container" | "anchor" | "initialFocus"> & {
    /** Places the popover against this instead of its trigger: a view, like a ref's `current`, or a point in window coordinates. A controller's `open({ anchor })` wins for that open. */
    anchor?: NativeAnchor | null
    /**
     * Where the screen reader's focus goes when the popover opens: its title,
     * or the popover itself with `"content"`, or nowhere with `"none"`.
     * @defaultValue "auto"
     */
    initialFocus?: "auto" | "content" | "none"
  } & ExitProps

type ArrowPartProps = PartProps<
  typeof View,
  PopoverArrowState & PopoverArrowPlacementState
>

type PopoverParts = Parts<
  typeof popover,
  { title: typeof Text; description: typeof Text; close: typeof Pressable }
>

const parts: PopoverParts = createParts(
  popover,
  { title: Text, description: Text, close: Pressable },
  popoverNative
)

/**
 * A panel beside its trigger. Put its trigger and content inside. A
 * non-modal popover renders its content in the app's `OverlayHost`; a modal
 * one renders it in a `Modal`.
 * @experimental
 */
function Popover({ children, ...options }: PopoverProps) {
  const handle = usePrimitive(popover, options, popoverNative)
  useControllerEntry(options.controller, handle)
  const [outlet] = React.useState(createOutlet)
  return (
    <HandleScope handle={handle as unknown as PrimitiveHandle<never>}>
      <OutletContext.Provider value={outlet}>
        {children}
        <PopupLayer handle={handle} outlet={outlet} pressOutside />
      </OutletContext.Provider>
    </HandleScope>
  )
}

/**
 * The button that opens and closes the popover: a `Pressable` with the
 * button role and its expanded state.
 * @experimental
 */
const PopoverTrigger = popupTrigger(popover) as (
  props: TriggerPartProps
) => React.ReactElement | null

/**
 * The popover itself, a `View` placed beside its anchor, with the placement
 * in its state. VoiceOver's escape gesture on it closes the popover with the
 * `"escape-key"` reason. Pass `onExit` to keep it on screen while it
 * animates out.
 * @experimental
 */
function PopoverContent(props: ContentPartProps) {
  return useOutlet("content", <Placed {...props} />)
}

// Rendered where the content renders, so it measures in that host.
function Placed({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  initialFocus,
  finalFocus,
  keepMounted,
  ...props
}: ContentPartProps) {
  const handle = useHandle(popover)
  const placement = usePlacement(handle.api, useHost(), props.style)
  const placed = usePlaced(placement)
  return usePart(
    popover,
    "content",
    {
      side,
      align,
      sideOffset,
      alignOffset,
      collisionPadding,
      arrowPadding,
      anchor: anchor as never,
      initialFocus,
      finalFocus,
      keepMounted,
    },
    mergeProps(
      {
        ref: placement.content,
        style: {
          position: "absolute",
          top: placed?.y,
          ...(placed && fromLeft(placed.x)),
        },
        // The Modal's host isolates it, popups beside it included.
        accessibilityViewIsModal: false,
        onAccessibilityEscape: () => layerInput()?.escape(handle.api),
        onTouchStart: landIn(handle.api),
      },
      {
        ...props,
        ...withState<
          PopoverContentState & PresenceState,
          PopoverPlacementState
        >(props, () => ({ ...placed?.state })),
      }
    ),
    View
  )
}

/**
 * A `View` that points at the anchor, placed along the popover's edge facing
 * it. Hidden from screen readers.
 * @experimental
 */
function PopoverArrow(props: ArrowPartProps) {
  const handle = useHandle(popover)
  const placement = placementOf(handle.api)
  const arrow = usePlaced(placement)?.arrow
  const vertical = arrow?.side === "top" || arrow?.side === "bottom"
  return usePart(
    popover,
    "arrow",
    {},
    mergeProps(
      {
        ref: placement.arrow,
        style: {
          position: "absolute",
          ...(arrow &&
            (vertical ? fromLeft(arrow.offset) : { top: arrow.offset })),
        },
      },
      {
        ...props,
        ...withState<PopoverArrowState, PopoverArrowPlacementState>(
          props,
          () => ({
            side: arrow?.side,
            align: arrow?.align,
            arrowClamped: arrow?.arrowClamped,
          })
        ),
      }
    ),
    View
  )
}

/**
 * The popover's title, a `Text` with the header role, which names it and
 * takes the screen reader's focus when it opens.
 * @experimental
 */
function PopoverTitle(props: React.ComponentProps<PopoverParts["Title"]>) {
  return <parts.Title role="heading" {...props} />
}

/**
 * Describes the popover while it's rendered, in a `Text`.
 * @experimental
 */
const PopoverDescription: PopoverParts["Description"] = parts.Description

/**
 * A `Pressable` that closes the popover with the `"close-press"` reason.
 * @experimental
 */
const PopoverClose: PopoverParts["Close"] = parts.Close

export { createPopoverController } from "@ui-sdk/core/popover"
export type {
  PopoverApi,
  PopoverArrowState,
  PopoverContentState,
  PopoverController,
  PopoverDismissReason,
  PopoverFinalFocus,
  PopoverOpenChangeReason,
  PopoverOptions,
  PopoverPayloadChangeReason,
  PopoverPrimitive,
  PopoverTriggerState,
} from "@ui-sdk/core/popover"

export {
  type NativeAnchor,
  Popover,
  PopoverArrow,
  type PopoverArrowPlacementState,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  type PopoverPlacementState,
  type PopoverProps,
  PopoverTitle,
  PopoverTrigger,
}
