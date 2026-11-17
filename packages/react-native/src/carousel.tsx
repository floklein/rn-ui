import {
  carousel,
  type CarouselContentState,
  type CarouselControlProps,
  type CarouselIndicatorGroupState,
  type CarouselIndicatorProps,
  type CarouselIndicatorState,
  type CarouselItemState,
  type CarouselOptions,
  type CarouselPlayToggleState,
  type CarouselState,
  type CarouselStepState,
  type CarouselViewportState,
} from "@ui-sdk/core/carousel"
import { carouselNative, nativeCarousel } from "@ui-sdk/core/native"
import * as React from "react"
import {
  Animated,
  I18nManager,
  type LayoutChangeEvent,
  Pressable,
  View,
} from "react-native"
import { useControllerEntry, useControllerTarget } from "./controller-target"
import { mergeProps, renderElement } from "./render-element"
import {
  HandleScope,
  type PartProps,
  useHandle,
  useNearest,
  usePart,
  usePrimitive,
} from "./use-primitive"

/**
 * A region of slides that a drag or the parts page through. Name it with
 * `aria-label`.
 * @experimental
 */
function Carousel({
  page,
  defaultPage,
  onPageChange,
  onPageChangeComplete,
  playing,
  defaultPlaying,
  onPlayingChange,
  interval,
  orientation,
  align,
  slidesPerPage,
  loop,
  skipSnaps,
  dragFree,
  drag,
  controller,
  debug,
  ...props
}: CarouselOptions & PartProps<typeof View, CarouselState>) {
  const handle = usePrimitive(
    carousel,
    {
      page,
      defaultPage,
      onPageChange,
      onPageChangeComplete,
      playing,
      defaultPlaying,
      onPlayingChange,
      interval,
      orientation,
      align,
      slidesPerPage,
      loop,
      skipSnaps,
      dragFree,
      drag,
      controller,
      debug,
    },
    carouselNative
  )
  useControllerEntry(controller, handle)
  return usePart(handle, "root", {}, props as Record<string, unknown>, View)
}

const reportLayout =
  (
    handle: { api: Parameters<typeof nativeCarousel>[0] },
    slot: "viewport" | "content" | "item",
    key?: string
  ) =>
  (event: LayoutChangeEvent) =>
    nativeCarousel(handle.api).layout(slot, key, event.nativeEvent.layout)

/**
 * The window onto the slides, which clips them. A touch drag along its axis
 * moves them, and lets go on a page. In a plain `ScrollView` that scrolls
 * along the same axis, turn the scroll view's `scrollEnabled` off from its
 * `onResponderGrant` until `onResponderRelease` or `onResponderTerminate`.
 * @experimental
 */
function CarouselViewport(
  props: PartProps<typeof View, CarouselViewportState>
) {
  const handle = useHandle(carousel)
  return usePart(
    carousel,
    "viewport",
    {},
    mergeProps(
      { style: styles.viewport, onLayout: reportLayout(handle, "viewport") },
      props
    ),
    View
  )
}

/**
 * The row, or column, of slides, an `Animated.View` that moves along the
 * axis as the carousel pages.
 * @experimental
 */
function CarouselContent(
  props: PartProps<typeof Animated.View, CarouselContentState>
) {
  const handle = useHandle(carousel)
  const track = nativeCarousel(handle.api)
  const vertical = handle.state.orientation === "vertical"
  const sign = vertical || !I18nManager.isRTL ? -1 : 1
  const [offset] = React.useState(() => new Animated.Value(0))
  React.useLayoutEffect(() => {
    const follow = () => offset.setValue(sign * track.offset())
    follow()
    return track.subscribe(follow)
  }, [offset, sign, track])
  return usePart(
    carousel,
    "content",
    {},
    mergeProps(
      {
        style: vertical ? styles.column : styles.row,
        onLayout: reportLayout(handle, "content"),
      },
      props,
      {
        style: {
          transform: [
            vertical ? { translateY: offset } : { translateX: offset },
          ],
        },
      }
    ),
    Animated.View
  )
}

/**
 * One slide. It's labelled "1 of 5" unless it has an `aria-label`, and
 * hidden from screen readers while out of view.
 * @experimental
 */
function CarouselItem({
  id,
  ...props
}: PartProps<typeof View, CarouselItemState> & { id?: string }) {
  const handle = useHandle(carousel)
  const fallback = React.useId()
  const key = id ?? fallback
  const { instance } = handle
  const count = React.useSyncExternalStore(
    instance.subscribe,
    () => instance.get().order.length
  )
  const index = instance.get().order.indexOf(key)
  const named = props["aria-label"] ?? props["aria-labelledby"]
  return usePart(
    carousel,
    "item",
    { id: key },
    mergeProps(
      {
        style: styles.item,
        onLayout: reportLayout(handle, "item", key),
        "aria-label":
          named === undefined && index >= 0
            ? `${index + 1} of ${count}`
            : undefined,
      },
      props
    ),
    View
  )
}

// Parts that can sit outside their carousel, driven through `controller`,
// render as plain views until it mounts.
function Connected({
  controller,
  children,
  fallback,
}: CarouselControlProps & {
  children: React.ReactNode
  fallback: () => React.ReactNode
}) {
  const handle = useControllerTarget(controller as never, useNearest(carousel))
  if (!handle) {
    return fallback()
  }
  return controller ? (
    <HandleScope handle={handle}>{children}</HandleScope>
  ) : (
    children
  )
}

type StepProps = PartProps<typeof Pressable, CarouselStepState> &
  CarouselControlProps

const unconnected: CarouselStepState = { disabled: true }

function step(slot: "previous" | "next") {
  function Step(props: PartProps<typeof Pressable, CarouselStepState>) {
    return usePart(
      carousel,
      slot,
      {},
      props as Record<string, unknown>,
      Pressable
    )
  }
  return function CarouselStep({ controller, ...props }: StepProps) {
    const { render, ...rest } = props
    return (
      <Connected
        controller={controller}
        fallback={() =>
          renderElement(
            Pressable,
            {
              accessibilityRole: "button",
              accessibilityState: { disabled: true },
              ...rest,
            },
            render as never,
            unconnected
          )
        }
      >
        <Step {...props} />
      </Connected>
    )
  }
}

/**
 * Goes to the previous page, a `Pressable`. Read as disabled on the first
 * page without `loop`, where screen readers still reach it.
 * @experimental
 */
const CarouselPrevious = step("previous")

/**
 * Goes to the next page, a `Pressable`. Read as disabled on the last page
 * without `loop`, where screen readers still reach it.
 * @experimental
 */
const CarouselNext = step("next")

function IndicatorGroup(
  props: PartProps<typeof View, CarouselIndicatorGroupState>
) {
  return usePart(
    carousel,
    "indicator-group",
    {},
    props as Record<string, unknown>,
    View
  )
}

/**
 * The indicators, a tab list. Its children can be a function of the state.
 * @experimental
 */
function CarouselIndicatorGroup({
  controller,
  ...props
}: PartProps<typeof View, CarouselIndicatorGroupState> & CarouselControlProps) {
  const { render, ...rest } = props
  return (
    <Connected
      controller={controller}
      fallback={() =>
        renderElement(View, rest, render as never, {
          page: 1,
          pageCount: null,
        })
      }
    >
      <IndicatorGroup {...props} />
    </Connected>
  )
}

/**
 * Shows a page and goes to it: a tab, each its own accessible element.
 * Indicators past the page count hide themselves.
 * @experimental
 */
function CarouselIndicator({
  page,
  id,
  ...props
}: PartProps<typeof Pressable, CarouselIndicatorState> &
  CarouselIndicatorProps & { id?: string }) {
  const fallback = React.useId()
  if (!useNearest(carousel)) {
    const { render, ...rest } = props
    return renderElement(
      Pressable,
      { accessibilityRole: "tab", ...rest },
      render as never,
      { page: page ?? 0, selected: false }
    )
  }
  return <Indicator page={page} id={id ?? fallback} {...props} />
}

function Indicator({
  page,
  id,
  ...props
}: PartProps<typeof Pressable, CarouselIndicatorState> &
  CarouselIndicatorProps & { id: string }) {
  return usePart(
    carousel,
    "indicator",
    { page, id },
    props as Record<string, unknown>,
    Pressable
  )
}

function PlayToggle(
  props: PartProps<typeof Pressable, CarouselPlayToggleState>
) {
  return usePart(
    carousel,
    "play-toggle",
    {},
    props as Record<string, unknown>,
    Pressable
  )
}

/**
 * Starts and stops rotation, a `Pressable`. Label it from `playing` in its
 * state, as the carousel pattern asks.
 * @experimental
 */
function CarouselPlayToggle({
  controller,
  ...props
}: PartProps<typeof Pressable, CarouselPlayToggleState> &
  CarouselControlProps) {
  const { render, ...rest } = props
  return (
    <Connected
      controller={controller}
      fallback={() =>
        renderElement(
          Pressable,
          { accessibilityRole: "button", ...rest },
          render as never,
          { playing: false, paused: false }
        )
      }
    >
      <PlayToggle {...props} />
    </Connected>
  )
}

const styles = {
  viewport: { overflow: "hidden" as const },
  row: { flexDirection: "row" as const },
  column: { flexDirection: "column" as const },
  item: { flexShrink: 0 },
}

export { createCarouselController } from "@ui-sdk/core/carousel"
export type {
  CarouselAlign,
  CarouselApi,
  CarouselContentState,
  CarouselControlProps,
  CarouselController,
  CarouselIndicatorGroupState,
  CarouselIndicatorProps,
  CarouselIndicatorState,
  CarouselItemState,
  CarouselNextState,
  CarouselOptions,
  CarouselOrientation,
  CarouselPageChangeReason,
  CarouselPageOptions,
  CarouselPlayToggleState,
  CarouselPlayingChangeReason,
  CarouselPlayingOptions,
  CarouselPreviousState,
  CarouselPrimitive,
  CarouselSlidesPerPage,
  CarouselState,
  CarouselStepState,
  CarouselViewportState,
} from "@ui-sdk/core/carousel"

export {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselIndicatorGroup,
  CarouselItem,
  CarouselNext,
  CarouselPlayToggle,
  CarouselPrevious,
  CarouselViewport,
}
