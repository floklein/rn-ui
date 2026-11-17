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
  AccessibilityInfo,
  Animated,
  Easing,
  type HostInstance,
  I18nManager,
  Keyboard,
  type KeyboardEvent,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  type ScrollViewInstance,
  StyleSheet,
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

type Track = { value: Animated.Value; at: (extent: number) => number }

function createMotion() {
  const extent = new Animated.Value(0)
  const fade = new Animated.Value(1)
  const stack = new Animated.Value(0)
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
    fade.setValue(1)
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
  // As the web's `--drawer-stack`: the drawer it opened from steps back from
  // 0 to 1 as it rises, the one below that from 1 to 2, and so on.
  function tracks() {
    const largest = Math.max(layout.ranges.expand[1], 1)
    const progress = (to: number) => Math.min(1, Math.max(0, to / largest))
    const list: Track[] = [{ value: extent, at: (to) => to }]
    let depth = 0
    for (
      let below = stackedOn.get(motion);
      below;
      below = stackedOn.get(below)
    ) {
      const steps = depth++
      list.push({ value: below.stack, at: (to) => steps + progress(to) })
    }
    return list
  }
  const view: NativeSheetView = {
    measure: () =>
      layout.container && layout.content
        ? { container: layout.container, content: layout.content }
        : undefined,
    move(to) {
      stop()
      at = to
      tracks().forEach((track) => track.value.setValue(track.at(to)))
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
      running = spring.fade
        ? playFade(tracks(), fade, spring, land)
        : Math.abs(spring.to - spring.from) < 1
          ? playEachFrame(tracks(), spring, land)
          : playOnNativeDriver(tracks(), spring, land)
    },
    ranges: (ranges) => lay({ ranges }),
    reducedMotion: () => motion.reduced,
  }
  const motion = {
    extent,
    fade,
    stack,
    reduced: false,
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
  return motion
}

function playFade(
  [extent, ...below]: Track[],
  fade: Animated.Value,
  { from, to, duration, fade: direction }: NativeSheetSpring,
  land: () => void
) {
  const out = direction === "out"
  extent.value.setValue(out ? from : to)
  fade.setValue(out ? 1 : 0)
  const timing = (value: Animated.Value, toValue: number) =>
    Animated.timing(value, {
      toValue,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    })
  const animation = Animated.parallel([
    timing(fade, out ? 0 : 1),
    ...below.map((track) => {
      track.value.setValue(track.at(from))
      return timing(track.value, track.at(to))
    }),
  ])
  animation.start(({ finished }) => {
    if (finished) {
      extent.value.setValue(to)
      fade.setValue(1)
      land()
    }
  })
  return animation
}

// The native driver samples the easing before it starts, overshoot included.
// Every track is linear in the extent, so one easing serves them all.
function playOnNativeDriver(
  tracks: Track[],
  { from, to, duration, extentAt }: NativeSheetSpring,
  land: () => void
) {
  const easing = (progress: number) =>
    (extentAt(progress * duration) - from) / (to - from)
  const animation = Animated.parallel(
    tracks.map(({ value, at }) => {
      value.setValue(at(from))
      return Animated.timing(value, {
        toValue: at(to),
        duration,
        easing,
        useNativeDriver: true,
      })
    })
  )
  animation.start(({ finished }) => finished && land())
  return animation
}

// A spring that comes back where it started, like a refused dismissal's push,
// has no progress to ease, so it plays from JavaScript each frame.
function playEachFrame(
  tracks: Track[],
  { duration, extentAt }: NativeSheetSpring,
  land: () => void
) {
  const start = performance.now()
  let frame = requestAnimationFrame(function step() {
    const elapsed = performance.now() - start
    const extent = extentAt(Math.min(elapsed, duration))
    tracks.forEach(({ value, at }) => value.setValue(at(extent)))
    if (elapsed < duration) {
      frame = requestAnimationFrame(step)
    } else {
      land()
    }
  })
  return { stop: () => cancelAnimationFrame(frame) }
}

const motions = new WeakMap<object, Motion>()
const stackedOn = new WeakMap<Motion, Motion>()

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
  const parent = useNearest(drawer)
  const handle = usePrimitive(drawer, options, drawerNative)
  useControllerEntry(options.controller, handle)
  const [outlet] = React.useState(createOutlet)
  const [motion] = React.useState(createMotion)
  motion.modal = inModal(options)
  motions.set(handle.api, motion)
  const below = parent && motions.get(parent.api)
  if (below) {
    stackedOn.set(motion, below)
  }
  React.useEffect(() => {
    let live = true
    AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (live) {
        motion.reduced = on
      }
    })
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (on) => {
        motion.reduced = on
      }
    )
    return () => {
      live = false
      subscription.remove()
    }
  }, [motion])
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
      Animated.multiply(
        motion.extent.interpolate({
          inputRange: [dim[0], Math.max(dim[1], dim[0] + 1)],
          outputRange: [0, 1],
          extrapolate: "clamp",
        }),
        motion.fade
      ),
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
  // Each drawer open above scales it back by 4%, as the web's docs suggest.
  const stepBack = React.useMemo(
    () =>
      motion.stack.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }),
    [motion]
  )
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
            opacity: content ? motion.fade : 0,
            transform: [
              vertical(side)
                ? { translateY: translate }
                : { translateX: translate },
              { scale: stepBack },
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
  const frame = React.useRef<HostInstance>(null)
  const size = React.useRef({ width: 0, height: 0 })
  const { inset, slide } = useKeyboardInset(frame, motion, size, side)
  const laidOut = () => {
    const { width, height } = size.current
    motion.lay({ container: vertical(side) ? height - inset : width })
    nativeSheet(api).input?.layout()
  }
  React.useLayoutEffect(() => {
    if (size.current.height) {
      laidOut()
    }
    // Only the keyboard changes the room without a layout.
  }, [inset])
  return (
    <Animated.View
      ref={frame}
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFill,
        placement(side),
        { paddingBottom: inset, transform: [{ translateY: slide }] },
      ]}
      onLayout={(event: LayoutChangeEvent) => {
        size.current = event.nativeEvent.layout
        laidOut()
      }}
    >
      <GestureDetector gesture={pan}>{children}</GestureDetector>
    </Animated.View>
  )
}

// iOS tells of the keyboard before it moves, Android once it has moved.
const keyboardEvents =
  Platform.OS === "ios"
    ? (["keyboardWillChangeFrame"] as const)
    : (["keyboardDidShow", "keyboardDidHide"] as const)

// UIKit's keyboard curve, as the web's sheet rides it.
const keyboardCurve = Easing.bezier(0.38, 0.7, 0.125, 1)

// The frame takes its new place at once and slides there from where it was
// drawn. A drawer taller than the room keeps its height and lets the keyboard
// cover its bottom, as iOS does.
function useKeyboardInset(
  frame: React.RefObject<HostInstance | null>,
  motion: Motion,
  size: React.RefObject<{ width: number; height: number }>,
  side: Side
) {
  const [inset, setInset] = React.useState(0)
  const [slide] = React.useState(() => new Animated.Value(0))
  const shown = React.useRef(0)
  React.useEffect(() => {
    const follow = ({ endCoordinates, duration }: KeyboardEvent) =>
      frame.current?.measureInWindow((_x, y, _width, height) => {
        const covered = Math.max(0, y + height - endCoordinates.screenY)
        const room = vertical(side)
          ? Math.max(0, size.current.height - motion.get().content)
          : covered
        const next = endCoordinates.height ? Math.min(covered, room) : 0
        const shift = next - shown.current
        if (Math.abs(shift) < 1) {
          return
        }
        shown.current = next
        setInset(next)
        slide.setValue(motion.reduced ? 0 : shift)
        Animated.timing(slide, {
          toValue: 0,
          duration: motion.reduced ? 0 : duration || 250,
          easing: keyboardCurve,
          useNativeDriver: true,
        }).start()
      })
    const subscriptions = keyboardEvents.map((name) =>
      Keyboard.addListener(name, follow)
    )
    return () => subscriptions.forEach((subscription) => subscription.remove())
  }, [frame, motion, size, side, slide])
  return { inset, slide }
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
