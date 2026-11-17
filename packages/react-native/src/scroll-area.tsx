import { nativeScrollView } from "@ui-sdk/core/native"
import {
  scrollArea,
  type ScrollAreaPrimitive,
  type ScrollAreaScrollbarProps,
  type ScrollAreaScrollbarState,
  type ScrollAreaState,
  type ScrollAreaThumbState,
} from "@ui-sdk/core/scroll-area"
import * as React from "react"
import {
  type GestureResponderEvent,
  type HostInstance,
  I18nManager,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  View,
} from "react-native"
import { carry } from "./carried-context"
import { mergeProps } from "./render-element"
import {
  createParts,
  type PartProps,
  type Parts,
  ScrollHoldContext,
  useHandle,
  usePart,
} from "./use-primitive"

type ScrollAreaParts = Parts<
  ScrollAreaPrimitive,
  {
    root: typeof View
    content: typeof View
    "scroll-to-end": typeof Pressable
  }
>

type Orientation = NonNullable<ScrollAreaScrollbarProps["orientation"]>

const parts: ScrollAreaParts = createParts(scrollArea, {
  root: View,
  content: View,
  "scroll-to-end": Pressable,
})

const OrientationContext = carry(
  "ScrollAreaOrientation",
  React.createContext<Orientation>("vertical")
)

const axisOf = (orientation: Orientation) =>
  orientation === "horizontal" ? ("x" as const) : ("y" as const)

// Android measures a right-to-left horizontal scroll from the left edge.
const flipsX = () => I18nManager.isRTL && Platform.OS === "android"

/**
 * Groups the parts. The scrollbars are placed against it.
 * @experimental
 */
const ScrollArea: ScrollAreaParts["Root"] = parts.Root

/**
 * The scroller, a `ScrollView`, which touch and screen readers scroll. Pass
 * `horizontal` for a scroll area that scrolls along the inline axis. It
 * stops scrolling while a drag inside it, like a slider's, holds the touch.
 * @experimental
 */
function ScrollAreaViewport({
  scrollEnabled = true,
  ...props
}: PartProps<typeof ScrollView, ScrollAreaState>) {
  const handle = useHandle(scrollArea)
  const view = nativeScrollView(handle.api)
  const scroll = React.useRef<ScrollViewInstance>(null)
  const width = React.useRef({ client: 0, scroll: 0 })
  const [holds, setHolds] = React.useState(0)
  const hold = React.useCallback(() => {
    setHolds((count) => count + 1)
    return () => setHolds((count) => count - 1)
  }, [])
  React.useLayoutEffect(
    () =>
      view.attach({
        scrollTo(axis, position, animated) {
          const { client, scroll: content } = width.current
          scroll.current?.scrollTo(
            axis === "y"
              ? { y: position, animated }
              : {
                  x: flipsX() ? content - client - position : position,
                  animated,
                }
          )
        },
      }),
    [view]
  )
  const report = ({
    contentOffset,
    layoutMeasurement,
    contentSize,
  }: NativeScrollEvent) => {
    width.current = {
      client: layoutMeasurement.width,
      scroll: contentSize.width,
    }
    const max = contentSize.width - layoutMeasurement.width
    view.report({
      offset: {
        x: flipsX() ? max - contentOffset.x : contentOffset.x,
        y: contentOffset.y,
      },
      size: layoutMeasurement,
      content: contentSize,
    })
  }
  const { counted, scrollbarsX, scrollbarsY } = handle.state
  const indicators = counted && scrollbarsX + scrollbarsY === 0
  return (
    <ScrollHoldContext value={hold}>
      {usePart(
        handle,
        "viewport",
        {},
        mergeProps(
          {
            ref: scroll,
            scrollEnabled: scrollEnabled && holds === 0,
            scrollEventThrottle: 16,
            showsVerticalScrollIndicator: indicators,
            showsHorizontalScrollIndicator: indicators,
          },
          props,
          // Last, so they run first: the app's handlers read the new position.
          {
            onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) =>
              report(event.nativeEvent),
            onLayout: ({ nativeEvent }: LayoutChangeEvent) => {
              width.current.client = nativeEvent.layout.width
              view.report({ size: nativeEvent.layout })
            },
            onContentSizeChange: (contentWidth: number, height: number) => {
              width.current.scroll = contentWidth
              view.report({ content: { width: contentWidth, height } })
            },
            onScrollBeginDrag: () => view.touch(true),
            onScrollEndDrag: () => view.touch(false),
          }
        ),
        ScrollView
      )}
    </ScrollHoldContext>
  )
}

/**
 * Wraps the content inside the viewport.
 * @experimental
 */
const ScrollAreaContent: ScrollAreaParts["Content"] = parts.Content

/**
 * A scrollbar for one axis, over the viewport's edge, hidden from screen
 * readers. A touch on its thumb drags it, and elsewhere pages toward it.
 * @experimental
 */
function ScrollAreaScrollbar({
  orientation = "vertical",
  ...props
}: ScrollAreaScrollbarProps &
  PartProps<typeof View, ScrollAreaScrollbarState>) {
  const handle = useHandle(scrollArea)
  const view = nativeScrollView(handle.api)
  const axis = axisOf(orientation)
  const track = React.useRef<HostInstance>(null)
  React.useLayoutEffect(() => view.scrollbar(axis), [view, axis])
  const pointOf = (event: GestureResponderEvent) => {
    const box = track.current?.getBoundingClientRect()
    if (!box) {
      return 0
    }
    const { pageX, pageY } = event.nativeEvent
    if (axis === "y") {
      return pageY - box.top
    }
    return I18nManager.isRTL ? box.left + box.width - pageX : pageX - box.left
  }
  const state = handle.state
  const overflow = axis === "x" ? state.overflowX : state.overflowY
  const visible = axis === "x" ? state.visibleX : state.visibleY
  return (
    <OrientationContext value={orientation}>
      {usePart(
        handle,
        "scrollbar",
        { id: orientation, orientation },
        mergeProps(
          {
            ref: track,
            pointerEvents: visible ? "auto" : "none",
            style: [
              axis === "y" ? styles.vertical : styles.horizontal,
              !overflow && state.type !== "always" && styles.gone,
            ],
            onLayout: ({ nativeEvent }: LayoutChangeEvent) =>
              view.track(
                axis,
                axis === "y"
                  ? nativeEvent.layout.height
                  : nativeEvent.layout.width
              ),
            onStartShouldSetResponder: () => overflow,
            onResponderTerminationRequest: () => false,
            onResponderGrant: (event: GestureResponderEvent) =>
              view.press(axis, pointOf(event)),
            onResponderMove: (event: GestureResponderEvent) =>
              view.move(pointOf(event)),
            onResponderRelease: () => view.lift(),
            onResponderTerminate: () => view.lift(),
          },
          props
        ),
        View
      )}
    </OrientationContext>
  )
}

/**
 * The part of the scrollbar that shows where the view is, and drags.
 * @experimental
 */
function ScrollAreaThumb(props: PartProps<typeof View, ScrollAreaThumbState>) {
  const orientation = React.use(OrientationContext)
  const handle = useHandle(scrollArea)
  const view = nativeScrollView(handle.api)
  const axis = axisOf(orientation)
  const { size, offset } = React.useSyncExternalStore(view.watch, () =>
    view.thumb(axis)
  )
  const overflow =
    axis === "x" ? handle.state.overflowX : handle.state.overflowY
  const place =
    axis === "y"
      ? { height: size, transform: [{ translateY: offset }] }
      : {
          width: size,
          transform: [{ translateX: I18nManager.isRTL ? -offset : offset }],
        }
  return usePart(
    handle,
    "thumb",
    { id: orientation, orientation },
    mergeProps({ style: [place, !overflow && styles.gone] }, props),
    View
  )
}

/**
 * Where the two scrollbars meet. Only there while both show.
 * @experimental
 */
function ScrollAreaCorner(props: PartProps<typeof View>) {
  const handle = useHandle(scrollArea)
  const { overflowX, overflowY, scrollbarsX, scrollbarsY } = handle.state
  const both = overflowX && overflowY && scrollbarsX > 0 && scrollbarsY > 0
  return usePart(
    handle,
    "corner",
    {},
    mergeProps({ style: [styles.corner, !both && styles.gone] }, props),
    View
  )
}

/**
 * A button that scrolls to the end, like "Jump to latest", a `Pressable`.
 * Name it with its content.
 * @experimental
 */
const ScrollAreaScrollToEnd: ScrollAreaParts["ScrollToEnd"] = parts.ScrollToEnd

const styles = {
  vertical: { position: "absolute", top: 0, bottom: 0, end: 0 },
  horizontal: { position: "absolute", bottom: 0, start: 0, end: 0 },
  corner: { position: "absolute", bottom: 0, end: 0 },
  gone: { display: "none" },
} as const

export { createScrollAreaController } from "@ui-sdk/core/scroll-area"
export type {
  ScrollAreaController,
  ScrollAreaOptions,
  ScrollAreaPrimitive,
  ScrollAreaScrollOptions,
  ScrollAreaScrollToEndState,
  ScrollAreaScrollbarProps,
  ScrollAreaScrollbarState,
  ScrollAreaState,
  ScrollAreaThumbState,
  ScrollAreaType,
} from "@ui-sdk/core/scroll-area"

export {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaScrollToEnd,
  ScrollAreaThumb,
  ScrollAreaViewport,
}
