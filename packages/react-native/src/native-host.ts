import type { Part } from "@ui-sdk/core"
import {
  type NativeDrag,
  type NativeInput,
  type NativeSeen,
  type NativeTextField,
  nativePressSource,
  setNativeHost,
} from "@ui-sdk/core/native"
import { withSource } from "@ui-sdk/core/renderer"
import {
  AccessibilityInfo,
  BackHandler,
  type GestureResponderEvent,
  type HostInstance,
  I18nManager,
} from "react-native"

const views: WeakMap<Part, HostInstance> = new WeakMap()
const textInputs: WeakSet<HostInstance> = new WeakSet()
const fields: WeakMap<object, NativeTextField> = new WeakMap()
const renders: WeakMap<Part, number> = new WeakMap()
const controls: WeakMap<object, () => void> = new WeakMap()
const controlsById: Map<string, (() => void)[]> = new Map()
const parts: WeakMap<HostInstance, Part> = new WeakMap()
const drags: WeakMap<Part, NativeDrag> = new WeakMap()
const steps: WeakMap<Part, (direction: 1 | -1) => void> = new WeakMap()
const seen: WeakMap<Part, () => NativeSeen> = new WeakMap()
const holds: WeakMap<Part, () => void> = new WeakMap()
const scrollAreas: Set<{
  box: () =>
    { left: number; top: number; width: number; height: number } | undefined
  edgeScroll: (
    point: { x: number; y: number },
    options: { edge: number; speed: number },
    along: readonly ("x" | "y")[]
  ) => ("x" | "y")[]
}> = new Set()

// `onPress` doesn't say who pressed, so a press while a screen reader runs is
// taken as the screen reader's.
let screenReader = false
AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
  screenReader = enabled
})
AccessibilityInfo.addEventListener("screenReaderChanged", (enabled) => {
  screenReader = enabled
})
const pressSource = () => nativePressSource(screenReader ? "virtual" : "touch")

const following = 4

function partUnder(target: unknown) {
  for (
    let node = target as HostInstance | null;
    node;
    node = node.parentNode as HostInstance | null
  ) {
    const part = parts.get(node)
    if (part) {
      return part
    }
  }
}

const fingers = new WeakMap<Part, string>()
const downs = new WeakMap<Part, { x: number; y: number }>()
const claimed = new WeakMap<Part, { x: number; y: number }>()

// Fabric reports the first changed touch, so a second finger's moves would
// reach the responder as its own.
function touchOf(event: GestureResponderEvent, part: Part) {
  const { nativeEvent } = event
  const finger = nativeEvent.touches?.length
    ? nativeEvent.touches.find(
        (touch) => String(touch.identifier) === fingers.get(part)
      )
    : nativeEvent
  return (
    finger && {
      x: finger.pageX,
      y: finger.pageY,
      target: partUnder(event.target),
    }
  )
}

function register<Value>(map: WeakMap<Part, Value>, part: Part, value: Value) {
  map.set(part, value)
  return () => {
    if (map.get(part) === value) {
      map.delete(part)
    }
  }
}

let input: NativeInput | undefined
const layerInput = () => input

setNativeHost({
  focus(part) {
    const view = views.get(part)
    if (view) {
      if (textInputs.has(view)) {
        view.focus()
      }
      AccessibilityInfo.sendAccessibilityEvent(view, "focus")
    }
  },
  field: (part) => fields.get(part.api),
  announce(text, priority) {
    AccessibilityInfo.announceForAccessibilityWithOptions(text, {
      queue: priority === "polite",
    })
  },
  // The view tree keeps render order even for a part that rendered alone,
  // like one inserted between memoized siblings. A test renderer's views
  // can't compare, so there it's the order parts last rendered in.
  activate: (part) => controls.get(part.api)?.(),
  compare(a, b) {
    const first = views.get(a)
    const second = views.get(b)
    if (first?.compareDocumentPosition && second) {
      return first.compareDocumentPosition(second) & following ? -1 : 1
    }
    return (renders.get(a) ?? 0) - (renders.get(b) ?? 0)
  },
  isRTL: () => I18nManager.isRTL,
  box: (part) => views.get(part)?.getBoundingClientRect?.(),
  follow: (part, drag) => register(drags, part, drag),
  adjustable: (part, step) => register(steps, part, step),
  scrollNear(point, options) {
    const under = [...scrollAreas]
      .flatMap((area) => {
        const box = area.box()
        return box &&
          point.x >= box.left &&
          point.x <= box.left + box.width &&
          point.y >= box.top &&
          point.y <= box.top + box.height
          ? [{ area, box }]
          : []
      })
      .sort((a, b) => a.box.width * a.box.height - b.box.width * b.box.height)
    let along: ("x" | "y")[] = ["x", "y"]
    let scrolled = false
    for (const { area, box } of under) {
      const moved = area.edgeScroll(
        { x: point.x - box.left, y: point.y - box.top },
        options,
        along
      )
      along = along.filter((axis) => !moved.includes(axis))
      scrolled ||= moved.length > 0
    }
    return scrolled
  },
  seen: (part) => seen.get(part)?.(),
  // A Modal hears Android's back itself, through `onRequestClose`.
  listen(next) {
    input = next
    const back = BackHandler.addEventListener("hardwareBackPress", next.back)
    return () => {
      back.remove()
      if (input === next) {
        input = undefined
      }
    }
  },
})

const isFollowed = (part: Part) => drags.has(part)

const captures = (part: Part) => !!drags.get(part)?.capture

// A part unmounted mid-drag hears no release, so its unmount lets go too.
function letGo(part: Part) {
  holds.get(part)?.()
  holds.delete(part)
}

// Refusing termination and blocking native responders are meant to keep a
// scroll view from taking the touch; iOS pans a same-axis one anyway, so
// the app turns its scrollEnabled off (#71), and a Scroll Area its own.
function responder(part: Part, hold: (() => () => void) | null) {
  return {
    // Testing Library asks without an event.
    onStartShouldSetResponder: (event?: GestureResponderEvent) =>
      drags.get(part)?.accepts(
        event && {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
          target: partUnder(event.target),
        }
      ) ?? false,
    onStartShouldSetResponderCapture({ nativeEvent }: GestureResponderEvent) {
      if ((nativeEvent.touches?.length ?? 1) <= 1) {
        downs.set(part, { x: nativeEvent.pageX, y: nativeEvent.pageY })
      }
      return false
    },
    // A touch a button inside took becomes the part's drag once it moves.
    onMoveShouldSetResponderCapture({ nativeEvent }: GestureResponderEvent) {
      const drag = drags.get(part)
      const down = downs.get(part)
      if (
        !drag?.claims ||
        !down ||
        !drag.accepts() ||
        !drag.claims(nativeEvent.pageX - down.x, nativeEvent.pageY - down.y)
      ) {
        return false
      }
      claimed.set(part, down)
      return true
    },
    onResponderTerminationRequest: () => false,
    onResponderGrant(event: GestureResponderEvent) {
      fingers.set(part, String(event.nativeEvent.identifier))
      letGo(part)
      if (hold) {
        holds.set(part, hold())
      }
      const touch = touchOf(event, part)
      const from = claimed.get(part)
      claimed.delete(part)
      if (touch) {
        withSource("touch", () =>
          drags.get(part)?.start(from ? { ...touch, ...from } : touch)
        )
      }
      return true
    },
    onResponderMove(event: GestureResponderEvent) {
      const touch = touchOf(event, part)
      if (touch) {
        withSource("touch", () => drags.get(part)?.move(touch))
      }
    },
    onResponderRelease() {
      letGo(part)
      withSource("touch", () => drags.get(part)?.end())
    },
    onResponderTerminate() {
      letGo(part)
      withSource("touch", () => drags.get(part)?.cancel())
    },
  }
}

export {
  captures,
  controls,
  controlsById,
  fields,
  isFollowed,
  layerInput,
  letGo,
  parts,
  pressSource,
  renders,
  responder,
  scrollAreas,
  seen,
  steps,
  textInputs,
  views,
}
