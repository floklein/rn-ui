import {
  hoverCard,
  type HoverCardArrowState,
  type HoverCardContentProps,
  type HoverCardContentState,
  type HoverCardController,
  type HoverCardOptions,
  type HoverCardTriggerProps,
  type HoverCardTriggerState,
} from "@ui-sdk/core/hover-card"
import { hoverCardNative } from "@ui-sdk/core/native"
import type { PresenceState } from "@ui-sdk/core/renderer"
import * as React from "react"
import { type PointerEvent, Pressable, View } from "react-native"
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
import type {
  PopoverArrowPlacementState,
  PopoverPlacementState,
} from "./popover"
import {
  createOutlet,
  OutletContext,
  PopupLayer,
  popupTrigger,
  useOutlet,
} from "./popup-parts"
import { mergeProps, withState } from "./render-element"
import {
  type ExitProps,
  HandleScope,
  type PartProps,
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
type HoverCardPlacementState = PopoverPlacementState

/**
 * The fields placement adds to the arrow's state.
 * @experimental
 */
type HoverCardArrowPlacementState = PopoverArrowPlacementState

/**
 * The props of `HoverCard`.
 * @experimental
 */
type HoverCardProps = Omit<HoverCardOptions, "container"> & {
  children?: React.ReactNode
}

type TriggerPartProps = PartProps<typeof Pressable, HoverCardTriggerState> &
  Omit<HoverCardTriggerProps, "controller"> & {
    /** Connects a trigger outside the card, like every author link in a feed, to the card with this controller. */
    controller?: HoverCardController<any>
  }

type ContentPartProps<Payload = unknown> = PartProps<
  typeof View,
  HoverCardContentState<Payload> & PresenceState & HoverCardPlacementState
> &
  Omit<HoverCardContentProps, "container" | "anchor"> & {
    /** Places the card against this instead of its trigger: a view, like a ref's `current`, or a point in window coordinates. */
    anchor?: NativeAnchor | null
  } & ExitProps

type ArrowPartProps = PartProps<
  typeof View,
  HoverCardArrowState & HoverCardArrowPlacementState
>

// Pointer events reach `onPointerEnter` only where the app turned them on.
const pointer = (event: PointerEvent) =>
  event.nativeEvent as unknown as globalThis.PointerEvent

/**
 * A preview of what a link points to. On a touch screen it stays closed;
 * with a pointer, resting on the link opens it.
 * @experimental
 */
function HoverCard({ children, ...options }: HoverCardProps) {
  const handle = usePrimitive(hoverCard, options, hoverCardNative)
  useControllerEntry(options.controller, handle)
  const [outlet] = React.useState(createOutlet)
  return (
    <HandleScope handle={handle as unknown as PrimitiveHandle<never>}>
      <OutletContext.Provider value={outlet}>
        {children}
        <PopupLayer handle={handle} outlet={outlet} modal={false} />
      </OutletContext.Provider>
    </HandleScope>
  )
}

function TriggerPart({
  id,
  payload,
  ...props
}: Omit<TriggerPartProps, "controller">) {
  const fallback = React.useId()
  const key = id ?? fallback
  const handle = useHandle(hoverCard)
  const { hover } = handle.api.internal
  return usePart(
    hoverCard,
    "trigger",
    { id: key, payload },
    mergeProps(
      {
        onTouchStart: landIn(handle.api),
        onPointerEnter: (event: PointerEvent) =>
          hover?.enter(pointer(event), key, payload),
        onPointerLeave: (event: PointerEvent) => hover?.leave(pointer(event)),
      },
      props as Record<string, unknown>
    ),
    Pressable
  )
}

const Trigger = popupTrigger(hoverCard, TriggerPart as never) as (
  props: TriggerPartProps
) => React.ReactElement | null

/**
 * The link the card previews: a `Pressable` with the link role. Its press is
 * the app's `onPress`, like following the link; it never opens the card.
 * @experimental
 */
function HoverCardTrigger(props: TriggerPartProps) {
  return <Trigger role="link" {...props} />
}

/**
 * The card itself, a `View` placed beside its anchor in the app's
 * `OverlayHost`, with the placement in its state. VoiceOver's escape gesture
 * on it closes the card. Pass `onExit` to keep it on screen while it
 * animates out.
 * @experimental
 */
function HoverCardContent<Payload = unknown>(props: ContentPartProps<Payload>) {
  return useOutlet("content", <Placed {...(props as ContentPartProps)} />)
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
  keepMounted,
  ...props
}: ContentPartProps) {
  const handle = useHandle(hoverCard)
  const mounted = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => handle.state.mounted
  )
  const placement = usePlacement(handle.api, useHost(), props.style, mounted)
  const placed = usePlaced(placement)
  const { hover } = handle.api.internal
  return usePart(
    hoverCard,
    "content",
    {
      side,
      align,
      sideOffset,
      alignOffset,
      collisionPadding,
      arrowPadding,
      anchor: anchor as never,
      keepMounted,
    },
    mergeProps(
      {
        ref: placement.content,
        style: {
          position: "absolute",
          top: placed?.y,
          opacity: placed ? undefined : 0,
          ...(placed && fromLeft(placed.x)),
        },
        onAccessibilityEscape: () => layerInput()?.escape(handle.api),
        onTouchStart: landIn(handle.api),
        onPointerEnter: (event: PointerEvent) => hover?.enter(pointer(event)),
        onPointerLeave: (event: PointerEvent) =>
          hover?.leaveContent(pointer(event)),
      },
      {
        ...props,
        ...withState<
          HoverCardContentState & PresenceState,
          HoverCardPlacementState
        >(props, () => ({ ...placed?.state })),
      }
    ),
    View
  )
}

/**
 * A `View` that points at the trigger, placed along the card's edge facing
 * it. Hidden from screen readers.
 * @experimental
 */
function HoverCardArrow(props: ArrowPartProps) {
  const handle = useHandle(hoverCard)
  const placement = placementOf(handle.api)
  const arrow = usePlaced(placement)?.arrow
  const vertical = arrow?.side === "top" || arrow?.side === "bottom"
  return usePart(
    hoverCard,
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
        ...withState<HoverCardArrowState, HoverCardArrowPlacementState>(
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

export { createHoverCardController } from "@ui-sdk/core/hover-card"
export type {
  HoverCardApi,
  HoverCardArrowState,
  HoverCardContentState,
  HoverCardController,
  HoverCardOpenChangeReason,
  HoverCardOptions,
  HoverCardPayloadChangeReason,
  HoverCardPrimitive,
  HoverCardTriggerState,
} from "@ui-sdk/core/hover-card"

export {
  HoverCard,
  HoverCardArrow,
  type HoverCardArrowPlacementState,
  HoverCardContent,
  type HoverCardPlacementState,
  type HoverCardProps,
  HoverCardTrigger,
  type NativeAnchor,
}
