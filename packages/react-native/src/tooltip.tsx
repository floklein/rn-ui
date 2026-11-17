import { tooltipNative } from "@ui-sdk/core/native"
import type { PresenceState } from "@ui-sdk/core/renderer"
import { press } from "@ui-sdk/core/renderer"
import {
  tooltip,
  type TooltipArrowState,
  type TooltipContentProps,
  type TooltipContentState,
  type TooltipController,
  type TooltipOptions,
  type TooltipTriggerProps,
  type TooltipTriggerState,
} from "@ui-sdk/core/tooltip"
import * as React from "react"
import {
  AccessibilityInfo,
  type PointerEvent,
  Pressable,
  View,
} from "react-native"
import { useControllerEntry } from "./controller-target"
import { layerInput } from "./native-host"
import { plainText, textOf, useText } from "./names"
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
  closeDelayFloor,
  createOutlet,
  OutletContext,
  PopupLayer,
  popupTrigger,
  useOutlet,
} from "./popup-parts"
import { idle, mergeProps, withState } from "./render-element"
import {
  type ExitProps,
  HandleScope,
  type PartProps,
  type PrimitiveHandle,
  useHandle,
  usePart,
  usePressedPart,
  usePrimitive,
} from "./use-primitive"

/**
 * The fields placement adds to the content's state, as the web's CSS
 * variables and data attributes. Undefined until it's first placed.
 * @experimental
 */
type TooltipPlacementState = PopoverPlacementState

/**
 * The fields placement adds to the arrow's state.
 * @experimental
 */
type TooltipArrowPlacementState = PopoverArrowPlacementState

/**
 * The props of `Tooltip`.
 * @experimental
 */
type TooltipProps = Omit<TooltipOptions, "container" | "shortcut"> & {
  children?: React.ReactNode
}

type TriggerPartProps = PartProps<typeof Pressable, TooltipTriggerState> &
  Omit<TooltipTriggerProps, "controller"> & {
    /** Connects a trigger outside the tooltip, like one per row, to the tooltip with this controller. */
    controller?: TooltipController<any>
  }

type ContentPartProps<Payload = unknown> = PartProps<
  typeof View,
  TooltipContentState<Payload> & PresenceState & TooltipPlacementState
> &
  Omit<TooltipContentProps, "container" | "anchor"> & {
    /** Places the tooltip against this instead of its trigger: a view, like a ref's `current`, or a point in window coordinates. */
    anchor?: NativeAnchor | null
  } & ExitProps

type ArrowPartProps = PartProps<
  typeof View,
  TooltipArrowState & TooltipArrowPlacementState
>

type Handle = PrimitiveHandle<typeof tooltip>

const contentId = (handle: Handle) => `${handle.instance.id}-content`

// Pointer events reach `onPointerEnter` only where the app turned them on.
const pointer = (event: PointerEvent) =>
  event.nativeEvent as unknown as globalThis.PointerEvent

/**
 * A short label or hint for its trigger. On a touch screen it stays closed,
 * unless it's `toggleable`, which a press opens; with a pointer, resting on
 * the trigger opens it. Either way its text names or describes the trigger
 * for screen readers.
 * @experimental
 */
function Tooltip({ children, closeDelay, ...options }: TooltipProps) {
  const handle = usePrimitive(
    tooltip,
    { ...options, closeDelay: Math.max(closeDelay ?? 0, closeDelayFloor) },
    tooltipNative
  )
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

const ownName = (props: Record<string, unknown>) =>
  !!(
    props["aria-label"] ||
    props["aria-labelledby"] ||
    props.accessibilityLabel ||
    (typeof props.children !== "function" && plainText(props.children, true))
  )

function TriggerPart({
  id,
  payload,
  ...props
}: Omit<TriggerPartProps, "controller">) {
  const fallback = React.useId()
  const key = id ?? fallback
  const handle = useHandle(tooltip) as Handle
  const named = ownName(props)
  React.useLayoutEffect(() => {
    const { store } = handle.instance.part("trigger", { id: key }, true)
    if (store.get().trigger === key && store.get().unnamed === named) {
      store.set({ unnamed: !named })
    }
  })
  const { internal } = handle.api
  return usePressedPart(
    tooltip,
    "trigger",
    { id: key, payload },
    mergeProps(
      {
        onTouchStart: landIn(handle.api),
        onPointerEnter: (event: PointerEvent) =>
          internal.enter(pointer(event), key, payload),
        onPointerLeave: (event: PointerEvent) => internal.leave(pointer(event)),
      },
      props as Record<string, unknown>
    ),
    Pressable,
    (part) => {
      const activate = press(part)
      return () => {
        const closed = !handle.state.open
        activate?.()
        const text = textOf(contentId(handle))
        if (closed && handle.state.open && text) {
          AccessibilityInfo.announceForAccessibilityWithOptions(text, {
            queue: true,
          })
        }
      }
    }
  )
}

/**
 * The view the tooltip names or describes: a `Pressable` with the button
 * role. Its press opens and closes a `toggleable` tooltip, and closes any
 * other.
 * @experimental
 */
const TooltipTrigger = popupTrigger(tooltip, TriggerPart as never) as (
  props: TriggerPartProps
) => React.ReactElement | null

/**
 * The tooltip itself, a `View` placed beside its anchor in the app's
 * `OverlayHost`, with the placement in its state. Its text names or
 * describes the trigger while it's closed too. Pass `onExit` to keep it on
 * screen while it animates out.
 * @experimental
 */
function TooltipContent<Payload = unknown>(props: ContentPartProps<Payload>) {
  const handle = useHandle(tooltip) as Handle
  const state = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => handle.state
  )
  const { children } = props
  const body =
    typeof children === "function"
      ? children(
          {
            open: state.open,
            instant: state.instant,
            payload: state.payload as Payload,
            startingStyle: false,
            endingStyle: false,
          },
          idle
        )
      : children
  useText(contentId(handle), plainText(body, true))
  return useOutlet("content", <Placed {...(props as ContentPartProps)} />)
}

// Rendered where the content renders, so it measures in that host.
function Placed(props: ContentPartProps) {
  const handle = useHandle(tooltip) as Handle
  const mounted = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => handle.state.mounted
  )
  return mounted ? <Shown {...props} /> : null
}

function Shown({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  ...props
}: ContentPartProps) {
  const handle = useHandle(tooltip) as Handle
  const placement = usePlacement(handle.api, useHost(), props.style, true)
  const placed = usePlaced(placement)
  const { hover } = handle.api.internal
  return usePart(
    tooltip,
    "content",
    {
      side,
      align,
      sideOffset,
      alignOffset,
      collisionPadding,
      arrowPadding,
      anchor: anchor as never,
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
        onPointerLeave: (event: PointerEvent) => hover?.leave(pointer(event)),
      },
      {
        ...props,
        ...withState<
          TooltipContentState & PresenceState,
          TooltipPlacementState
        >(props, () => ({ ...placed?.state })),
      }
    ),
    View
  )
}

/**
 * A `View` that points at the trigger, placed along the tooltip's edge
 * facing it. Hidden from screen readers.
 * @experimental
 */
function TooltipArrow(props: ArrowPartProps) {
  const handle = useHandle(tooltip) as Handle
  const placement = placementOf(handle.api)
  const arrow = usePlaced(placement)?.arrow
  const vertical = arrow?.side === "top" || arrow?.side === "bottom"
  return usePart(
    tooltip,
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
        ...withState<TooltipArrowState, TooltipArrowPlacementState>(
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

export { createTooltipController } from "@ui-sdk/core/tooltip"
export type {
  TooltipApi,
  TooltipArrowState,
  TooltipContentState,
  TooltipController,
  TooltipOpenChangeReason,
  TooltipOptions,
  TooltipPayloadChangeReason,
  TooltipPrimitive,
  TooltipTriggerState,
} from "@ui-sdk/core/tooltip"

export {
  type NativeAnchor,
  Tooltip,
  TooltipArrow,
  type TooltipArrowPlacementState,
  TooltipContent,
  type TooltipPlacementState,
  type TooltipProps,
  TooltipTrigger,
}
