import type { dialog } from "@ui-sdk/core/dialog"
import {
  drawer,
  type DrawerBackdropState,
  type DrawerContentProps,
  type DrawerContentState,
  type DrawerController,
  type DrawerHandleState,
  type DrawerKeyframes,
  type DrawerOptions,
  type DrawerOutletState,
} from "@ui-sdk/core/drawer"
import {
  drawerNative,
  type NativeScrollArea,
  nativeSheet,
  type NativeSheetRanges,
  type NativeSheetSpring,
  type NativeSheetView,
} from "@ui-sdk/core/native"
import * as React from "react"
import {
  Animated,
  type HostInstance,
  I18nManager,
  type LayoutChangeEvent,
  Pressable,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from "react-native"
import {
  GestureDetector,
  GestureHandlerRootView,
  GestureStateManager,
  usePanGesture,
} from "react-native-gesture-handler"
import { useControllerEntry, useControllerTarget } from "./controller-target"
import {
  type DialogParts,
  dialogParts,
  type TriggerPartProps,
} from "./dialog-parts"
import { layerInput } from "./native-host"
import { landIn } from "./overlay-host"
import {
  createOutlet,
  OutletContext,
  PopupLayer,
  useOutlet,
} from "./popup-parts"
import { mergeProps, renderElement } from "./render-element"
import {
  HandleScope,
  type PartProps,
  type PrimitiveHandle,
  useHandle,
  useNearest,
  usePart,
  usePrimitive,
} from "./use-primitive"

const parts = dialogParts(drawer as unknown as typeof dialog, drawerNative)

// Typed as a Pressable, so its props name no React Native internals.
const AnimatedPressable: typeof Pressable = Animated.createAnimatedComponent(
  Pressable
) as never

type Side = DrawerContentState["side"]
type Layout = { container: number; content: number; ranges: NativeSheetRanges }
type Motion = ReturnType<typeof createMotion>

const vertical = (side: Side) => side === "bottom" || side === "top"
const towardEdge = (side: Side) =>
  side === "bottom" || side === "right" ? 1 : -1

function createMotion() {
  const extent = new Animated.Value(0)
  let layout: Layout = {
    container: 0,
    content: 0,
    ranges: { dim: [0, 1], expand: [0, 1] },
  }
  const listeners = new Set<() => void>()
  let running: { stop: () => void } | undefined
  let exit: (() => void) | undefined
  let at = 0
  const stop = () => {
    running?.stop()
    running = undefined
  }
  const closed = () => {
    if (at <= 0 && !running && exit) {
      const done = exit
      exit = undefined
      done()
    }
  }
  function lay(change: Partial<Layout>) {
    layout = { ...layout, ...change }
    listeners.forEach((listener) => listener())
  }
  const view: NativeSheetView = {
    measure: () =>
      layout.container && layout.content
        ? { container: layout.container, content: layout.content }
        : undefined,
    move(to) {
      stop()
      at = to
      extent.setValue(to)
      closed()
    },
    settle(spring, done) {
      stop()
      at = spring.to
      const land = () => {
        running = undefined
        done()
        closed()
      }
      running =
        Math.abs(spring.to - spring.from) < 1
          ? playEachFrame(extent, spring, land)
          : playOnNativeDriver(extent, spring, land)
    },
    ranges: (ranges) => lay({ ranges }),
  }
  return {
    extent,
    view,
    lay,
    modal: true,
    get: () => layout,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    exitWith(done: () => void) {
      exit = done
      closed()
    },
  }
}

// The native driver samples the easing before it starts, overshoot included.
function playOnNativeDriver(
  extent: Animated.Value,
  { from, to, duration, extentAt }: NativeSheetSpring,
  land: () => void
) {
  extent.setValue(from)
  const animation = Animated.timing(extent, {
    toValue: to,
    duration,
    easing: (progress) => (extentAt(progress * duration) - from) / (to - from),
    useNativeDriver: true,
  })
  animation.start(({ finished }) => finished && land())
  return animation
}

// A spring that comes back where it started, like a refused dismissal's push,
// has no progress to ease, so it plays from JavaScript each frame.
function playEachFrame(
  extent: Animated.Value,
  { duration, extentAt }: NativeSheetSpring,
  land: () => void
) {
  const start = performance.now()
  let frame = requestAnimationFrame(function step() {
    const elapsed = performance.now() - start
    extent.setValue(extentAt(Math.min(elapsed, duration)))
    if (elapsed < duration) {
      frame = requestAnimationFrame(step)
    } else {
      land()
    }
  })
  return { stop: () => cancelAnimationFrame(frame) }
}

const motions = new WeakMap<object, Motion>()

function useLayout(motion: Motion) {
  return React.useSyncExternalStore(motion.subscribe, motion.get)
}

function scrollAreaAt(
  root: HostInstance | null,
  x: number,
  y: number,
  side: Side
) {
  let found: HostInstance | undefined
  const visit = (node: HostInstance) => {
    // Jest's renderer gives views no DOM interface.
    for (const child of Array.from(node.children ?? []) as HostInstance[]) {
      const box = child.getBoundingClientRect()
      if (x < box.left || x > box.right || y < box.top || y > box.bottom) {
        continue
      }
      const scrolls = vertical(side)
        ? child.scrollHeight > child.clientHeight + 1
        : child.scrollWidth > child.clientWidth + 1
      if (scrolls && /ScrollView/.test(child.nodeName)) {
        found = child
      }
      visit(child)
    }
  }
  if (root) {
    visit(root)
  }
  if (!found) {
    return null
  }
  const view = found
  const max = vertical(side)
    ? view.scrollHeight - view.clientHeight
    : view.scrollWidth - view.clientWidth
  const scrolled = vertical(side) ? view.scrollTop : view.scrollLeft
  // Forward is away from the drawer's edge.
  const forward = side === "bottom" || side === "right"
  const area: NativeScrollArea = {
    position: forward ? scrolled : max - scrolled,
    max,
    // ScrollView puts its methods on its view; a `contentOffset` set as a
    // native prop would stay, and Android applies it again on later updates.
    scrollTo(position) {
      const offset = forward ? position : max - position
      ;(view as ScrollViewInstance).scrollTo({
        ...(vertical(side) ? { x: 0, y: offset } : { x: offset, y: 0 }),
        animated: false,
      })
    },
  }
  return {
    area,
    hold: () => view.setNativeProps({ scrollEnabled: false }),
    release: () => view.setNativeProps({ scrollEnabled: true }),
  }
}

function useSheetGesture(
  api: object,
  root: React.RefObject<HostInstance | null>,
  side: Side
) {
  const held = React.useRef<ReturnType<typeof scrollAreaAt>>(null)
  const ended = React.useRef(true)
  const input = () => nativeSheet(api).input
  const letGo = () => {
    held.current?.release()
    held.current = null
  }
  return usePanGesture({
    disableReanimated: true,
    runOnJS: true,
    manualActivation: true,
    onTouchesDown(event) {
      if (!ended.current || event.numberOfTouches > 1) {
        return
      }
      const { absoluteX, absoluteY } = event.allTouches[0]
      const scroll = scrollAreaAt(root.current, absoluteX, absoluteY, side)
      if (!input()?.down(absoluteX, absoluteY, scroll?.area ?? null)) {
        GestureStateManager.fail(event.handlerTag)
        return
      }
      ended.current = false
      scroll?.hold()
      held.current = scroll
    },
    onTouchesMove(event) {
      if (ended.current) {
        return
      }
      const { absoluteX, absoluteY } = event.allTouches[0]
      const claim = input()?.move(absoluteX, absoluteY)
      if (claim === "claim" && event.state !== 4) {
        GestureStateManager.activate(event.handlerTag)
      } else if (claim === "release") {
        ended.current = true
        letGo()
        GestureStateManager.fail(event.handlerTag)
      }
    },
    onDeactivate(event) {
      if (!ended.current) {
        ended.current = true
        input()?.up({ x: event.velocityX / 1000, y: event.velocityY / 1000 })
      }
    },
    onFinalize() {
      if (!ended.current) {
        ended.current = true
        input()?.up({ x: 0, y: 0 })
      }
      letGo()
    },
  })
}

type ContentPartProps = PartProps<typeof Animated.View, DrawerContentState> &
  Omit<DrawerContentProps, "container">

type RootProps = Omit<
  DrawerOptions,
  "container" | "modal" | "driver" | "themeColor" | "preventEdgeSwipe"
> & {
  /**
   * `true`: the drawer renders in a `Modal` over the screen, and a press
   * outside it only closes it. `false`: a drawer beside the screen, rendered
   * in the app's `OverlayHost`. With `modalAbove`, it renders there too.
   * @defaultValue true
   */
  modal?: boolean
  children?: React.ReactNode
}

/**
 * The props of `Drawer`.
 * @experimental
 */
type DrawerProps = RootProps

// A `Modal` takes every press, so a drawer the page stays usable beside renders in the host.
const inModal = (options: RootProps) =>
  options.modal !== false && options.modalAbove === undefined

const Root = ({ children }: { children: React.ReactNode }) => (
  <GestureHandlerRootView style={StyleSheet.absoluteFill}>
    {children}
  </GestureHandlerRootView>
)

/**
 * A dialog presented as a sheet that slides in from an edge and follows a
 * finger. Put its trigger, backdrop and content inside. Its entry imports
 * `react-native-gesture-handler`, which the app installs and renders at its
 * root; the drawer renders its own inside its `Modal`.
 * @experimental
 */
function Drawer({ children, ...options }: DrawerProps) {
  const handle = usePrimitive(drawer, options, drawerNative)
  useControllerEntry(options.controller, handle)
  const [outlet] = React.useState(createOutlet)
  const [motion] = React.useState(createMotion)
  motion.modal = inModal(options)
  motions.set(handle.api, motion)
  React.useLayoutEffect(() => {
    const bridge = nativeSheet(handle.api)
    bridge.view = motion.view
    return () => {
      if (bridge.view === motion.view) {
        bridge.view = undefined
      }
    }
  }, [handle.api, motion])
  return (
    <HandleScope handle={handle as unknown as PrimitiveHandle<never>}>
      <OutletContext.Provider value={outlet}>
        {children}
        <PopupLayer
          handle={handle}
          outlet={outlet}
          modal={motion.modal}
          Root={Root}
        />
      </OutletContext.Provider>
    </HandleScope>
  )
}

/**
 * The button that opens the drawer: a `Pressable` with the button role.
 * @experimental
 */
const DrawerTrigger: (
  props: Omit<TriggerPartProps, "controller"> & {
    controller?: DrawerController<any, any>
  }
) => React.ReactElement | null = parts.Trigger

/**
 * A `Pressable` behind the drawer, dimmed as the drawer rises: its opacity
 * follows the drawer, so give it a color like `#00000033`. A press on it
 * closes the drawer with the `"outside-press"` reason, unless the page is
 * usable beside the drawer, when presses go through.
 * @experimental
 */
function DrawerBackdrop(
  props: PartProps<typeof AnimatedPressable, DrawerBackdropState>
) {
  const handle = useHandle(drawer)
  const motion = motions.get(handle.api)!
  const { dim } = useLayout(motion).ranges
  const opacity = React.useMemo(
    () =>
      motion.extent.interpolate({
        inputRange: [dim[0], Math.max(dim[1], dim[0] + 1)],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
    [motion, dim]
  )
  const element = usePart(
    drawer,
    "backdrop",
    {},
    mergeProps(
      {
        accessible: false,
        onPress: () => layerInput()?.outsidePress(),
        pointerEvents: handle.state.interactive ? "none" : "auto",
      },
      props as Record<string, unknown>,
      {
        style: (state: DrawerBackdropState, interaction: never) => [
          typeof props.style === "function"
            ? props.style(state, interaction)
            : props.style,
          { opacity },
        ],
      }
    ),
    AnimatedPressable
  )
  return useOutlet("backdrop", element)
}

/**
 * The drawer itself, an `Animated.View` at its edge that follows a finger.
 * A drag on it, or on a scroll view inside it at its start, moves the drawer;
 * a scroll view scrolled away from its start scrolls. VoiceOver's escape
 * gesture closes it with the `"escape-key"` reason.
 * @experimental
 */
function DrawerContent({
  initialFocus,
  finalFocus,
  keepMounted,
  style,
  ...props
}: ContentPartProps) {
  const handle = useHandle(drawer)
  const motion = motions.get(handle.api)!
  const { content } = useLayout(motion)
  const { side } = handle.state
  const view = React.useRef<HostInstance>(null)
  const translate = React.useMemo(
    () =>
      motion.extent.interpolate({
        inputRange: [0, Math.max(content, 1)],
        outputRange: [towardEdge(side) * content, 0],
      }),
    [motion, content, side]
  )
  const laidOut = () => nativeSheet(handle.api).input?.layout()
  const element = usePart(
    drawer,
    "content",
    { initialFocus, finalFocus, keepMounted },
    mergeProps(
      {
        ref: view,
        // The Modal's host isolates it, popups beside it included.
        accessibilityViewIsModal: false,
        onAccessibilityEscape: () => layerInput()?.escape(handle.api),
        onTouchStart: landIn(handle.api),
        onLayout(event: LayoutChangeEvent) {
          const { width, height } = event.nativeEvent.layout
          motion.lay({ content: vertical(side) ? height : width })
          laidOut()
        },
      },
      props as Record<string, unknown>,
      {
        onExit: motion.exitWith,
        style: (state: DrawerContentState, interaction: never) => [
          typeof style === "function" ? style(state, interaction) : style,
          {
            opacity: content ? 1 : 0,
            transform: [
              vertical(side)
                ? { translateY: translate }
                : { translateX: translate },
            ],
          },
        ],
      }
    ),
    Animated.View
  )
  const viewport = element && (
    <SheetFrame api={handle.api} motion={motion} side={side} content={view}>
      {element}
    </SheetFrame>
  )
  return useOutlet("content", viewport)
}

// The gesture lives inside the `Modal`, beside its detector: in the
// content's own render, attaching it re-rendered the outlet without end.
function SheetFrame({
  api,
  motion,
  side,
  content,
  children,
}: {
  api: object
  motion: Motion
  side: Side
  content: React.RefObject<HostInstance | null>
  children: React.ReactElement
}) {
  const pan = useSheetGesture(api, content, side)
  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, placement(side)]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout
        motion.lay({ container: vertical(side) ? height : width })
        nativeSheet(api).input?.layout()
      }}
    >
      <GestureDetector gesture={pan}>{children}</GestureDetector>
    </View>
  )
}

// A row starts at the right edge right to left, and `side` is physical.
function placement(side: Side) {
  if (vertical(side)) {
    return {
      justifyContent: side === "top" ? "flex-start" : "flex-end",
    } as const
  }
  const atEnd = (side === "right") !== I18nManager.isRTL
  return {
    flexDirection: "row",
    justifyContent: atEnd ? "flex-end" : "flex-start",
  } as const
}

/**
 * The grabber, a `Pressable` VoiceOver and TalkBack adjust like a slider.
 * Pressing it moves to the next snap point; increment and decrement step.
 * Name it, like `aria-label="Resize"`.
 * @experimental
 */
function DrawerHandle(props: PartProps<typeof Pressable, DrawerHandleState>) {
  return usePart(
    drawer,
    "handle",
    {},
    {
      accessibilityRole: "adjustable",
      ...props,
      accessibilityActions: [
        { name: "increment" },
        { name: "decrement" },
        ...(props.accessibilityActions ?? []),
      ],
    } as Record<string, unknown>,
    Pressable
  )
}

/**
 * The drawer's title, a `Text` with the header role, which names the drawer
 * and takes the screen reader's focus when it opens.
 * @experimental
 */
const DrawerTitle: DialogParts["Title"] = parts.Title

/**
 * Describes the drawer while it's rendered, in a `Text`.
 * @experimental
 */
const DrawerDescription: DialogParts["Description"] = parts.Description

/**
 * A `Pressable` that closes the drawer. An `action` runs first, and a
 * Promise it returns keeps the drawer open until it settles.
 * @experimental
 */
const DrawerClose: DialogParts["Close"] = parts.Close

type OutletProps = PartProps<typeof Animated.View, DrawerOutletState> & {
  /** Keyframes it plays as the drawer expands, like `{ scale: [1, 0.94] }`: the first while collapsed, the last at the largest snap point. Transforms, `opacity` and the other styles the native driver animates. */
  keyframes?: DrawerKeyframes
  /** Connects an outlet outside the drawer, like the app's shell, to the drawer with this controller. */
  controller?: DrawerController<any, any>
}

const transforms = new Set([
  "scale",
  "scaleX",
  "scaleY",
  "translateX",
  "translateY",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "skewX",
  "skewY",
  "perspective",
])

// Pixel lengths become numbers, as native styles take them.
const outputOf = (values: (string | number)[]) =>
  values.every((value) => typeof value === "number" || /px$/.test(value))
    ? values.map((value) => parseFloat(String(value)))
    : values.map(String)

function keyframeStyle(
  extent: Animated.Value,
  [lower, upper]: [number, number],
  keyframes: DrawerKeyframes
) {
  const style: Record<string, unknown> = {}
  const transform: Record<string, unknown>[] = []
  for (const [name, values] of Object.entries(keyframes)) {
    const span = Math.max(upper - lower, 1)
    const value = extent.interpolate({
      inputRange: values.map(
        (_, index) => lower + (span * index) / Math.max(values.length - 1, 1)
      ),
      outputRange: outputOf(values) as number[],
      extrapolate: "clamp",
    })
    if (transforms.has(name)) {
      transform.push({ [name]: value })
    } else {
      style[name] = value
    }
  }
  return transform.length ? { ...style, transform } : style
}

/**
 * A view that follows the drawer, like the screen behind it: an
 * `Animated.View` that plays its `keyframes` as the drawer expands. Outside
 * the drawer, pass the drawer's `controller`.
 * @experimental
 */
function DrawerOutlet({ controller, ...props }: OutletProps) {
  const handle = useControllerTarget(controller, useNearest(drawer))
  const { keyframes: _, render, ...rest } = props
  if (!handle) {
    return renderElement(Animated.View, rest, render, { open: false })
  }
  const part = <OutletPart {...props} />
  return controller ? <HandleScope handle={handle}>{part}</HandleScope> : part
}

function OutletPart({
  keyframes,
  style,
  ...props
}: Omit<OutletProps, "controller">) {
  const handle = useHandle(drawer)
  const motion = motions.get(handle.api)!
  const { expand } = useLayout(motion).ranges
  const follow = keyframes
    ? keyframeStyle(motion.extent, expand, keyframes)
    : undefined
  return usePart(
    drawer,
    "outlet",
    { keyframes },
    {
      ...props,
      style: (state: DrawerOutletState, interaction: never) => [
        typeof style === "function" ? style(state, interaction) : style,
        follow,
      ],
    } as Record<string, unknown>,
    Animated.View
  )
}

export { createDrawerController, sheetPhysics } from "@ui-sdk/core/drawer"
export type {
  DrawerApi,
  DrawerBackdropState,
  DrawerContentProps,
  DrawerContentState,
  DrawerController,
  DrawerDismissAttemptDetails,
  DrawerDismissReason,
  DrawerHandleState,
  DrawerKeyframes,
  DrawerOpenChangeReason,
  DrawerOptions,
  DrawerOutletProps,
  DrawerOutletState,
  DrawerPayloadChangeReason,
  DrawerPrimitive,
  DrawerSide,
  DrawerSnapPointChangeReason,
  DrawerTriggerProps,
  SheetPhysics,
  SnapPoint,
} from "@ui-sdk/core/drawer"

export {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerOutlet,
  type DrawerProps,
  DrawerTitle,
  DrawerTrigger,
}
