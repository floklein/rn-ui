import { partOf } from "../kernel/native-element"
import type { Twin } from "../kernel/twin"
import { contentScroll } from "../motion/content-scroll"
import {
  initialState,
  next,
  type SheetConfig,
  type SheetEffect,
  type SheetEvent,
  type SheetSnapReason,
  type SheetState,
} from "../motion/machine"
import { sheetPhysics, type SheetPhysics } from "../motion/physics"
import { nearestIndex } from "../motion/projection"
import { settleTime, solveSpring } from "../motion/spring"
import {
  findSnapIndex,
  isAtOrBelow,
  resolveSnapPoints,
  type ResolvedSnapPoint,
  type SnapPoint,
} from "../motion/snap-points"
import type { Layer } from "../platform/layers"
import type { PhysicalSide } from "../platform/sides"
import { nativeSheet, type NativeScrollArea } from "./native-sheet"
import type * as Mirrored from "./sheet"
import { axisPoint, resolveSide, type SheetSide } from "./sheet-axis"
import type * as Native from "./sheet.native"

type SheetOptions = Mirrored.SheetOptions
type Sheet = Mirrored.Sheet

const none = () => {}

// Nothing on the native host drags with a mouse.
const isDragSurface = (_target: Element) => true

// The DOM registers the sheet's CSS variables ahead; native has none.
const prepareSheet = none

const sheetLayers = new WeakMap<Layer, () => Sheet | undefined>()

function parentSheet(layer: Layer) {
  for (let up = layer.parent; up; up = up.parent) {
    const sheet = sheetLayers.get(up)
    if (sheet) {
      return sheet
    }
  }
}

function withDefaults(options: SheetOptions) {
  return {
    side: () => "bottom" as SheetSide,
    // check-code: allow return-type the literal would widen to `string[]`.
    snapPoints: (): readonly SnapPoint[] => ["content"],
    snapPoint: () => null as SnapPoint | null,
    dismissible: () => true,
    modalAbove: () => undefined as SnapPoint | undefined,
    expandOnScroll: () => true,
    physics: () => undefined as Partial<SheetPhysics> | undefined,
    parent: () => undefined as Sheet | undefined,
    onSnap: none,
    onRest: none,
    onDismissAttempt: none,
    onDragChange: none,
    onLayout: none,
    ...(Object.fromEntries(
      Object.entries(options).filter(([, value]) => value !== undefined)
    ) as SheetOptions),
  }
}

// UIScrollView's normal deceleration, for content the sheet flings itself.
const contentDecelerationRate = 0.998

/**
 * The sheet on the native host. The host lays it out and moves its view
 * through `nativeSheet(api).view`, and feeds it one finger's touch through
 * `nativeSheet(api).input`. On a scroll view that isn't at its start while the
 * sheet rests at its largest, the touch is the scroll view's; otherwise the
 * sheet takes it and scrolls the content itself, as the machine says.
 */
function attachSheet(el: HTMLElement, input: SheetOptions) {
  const options = withDefaults(input)
  const bridge = nativeSheet(partOf(el)!.api)
  let side: PhysicalSide = resolveSide(options.side(), el)
  let resolved: ResolvedSnapPoint[] = []
  let physicsSource: Partial<SheetPhysics> | undefined
  const config: SheetConfig = {
    snapPoints: [],
    dimension: 0,
    dismissible: true,
    expandOnScroll: true,
    physics: sheetPhysics.ios,
    contentScroll,
  }
  let state: SheetState = initialState(0, -1)
  let shown = 0
  let dragging = false
  let closing: "swipe" | "close" | null = null
  let targetId: string | null = null
  let destroyed = false
  let pendingOpen: boolean | null = null
  let settles = 0
  let touch: { area: NativeScrollArea | null; scroll: number } | null = null
  let coast = 0
  const point = { x: 0, y: 0 }

  function readConfig() {
    const source = options.physics()
    if (source !== physicsSource) {
      physicsSource = source
      config.physics = source
        ? { ...sheetPhysics.ios, ...source }
        : sheetPhysics.ios
    }
    config.dismissible = options.dismissible()
    config.expandOnScroll = options.expandOnScroll()
    return config
  }

  function measure() {
    const size = bridge.view?.measure()
    if (!size) {
      return false
    }
    side = resolveSide(options.side(), el)
    const next = resolveSnapPoints(options.snapPoints(), {
      container: size.container,
      content: size.content,
      rootFontSize: 16,
    })
    if (!next.length) {
      next.push({
        id: "content",
        value: "content",
        extent: size.content,
        ids: ["content"],
      })
    }
    const changed =
      size.container !== config.dimension ||
      next.length !== resolved.length ||
      next.some(
        (point, index) =>
          point.id !== resolved[index].id ||
          Math.abs(point.extent - resolved[index].extent) >= 0.5
      )
    resolved = next
    config.dimension = size.container
    config.snapPoints = resolved.map(({ id, extent }) => ({ id, extent }))
    if (changed) {
      options.onLayout({ side, snapPoints: resolved })
      bridge.view?.ranges(
        rangesOf(config.snapPoints.map((point) => point.extent))
      )
    }
    return changed
  }

  const valueOf = (id: string | null) =>
    id === null
      ? null
      : (resolved.find((point) => point.id === id)?.value ?? null)

  const now = () => performance.now()

  function dispatch(event: SheetEvent) {
    if (destroyed) {
      return
    }
    const result = next(state, event, readConfig())
    state = result.state
    for (const effect of result.effects) {
      run(effect)
    }
    if ((state.phase === "dragging") !== dragging) {
      dragging = !dragging
      options.onDragChange(dragging)
    }
  }

  function run(effect: SheetEffect) {
    switch (effect.type) {
      case "move":
        shown = effect.extent
        settles++
        return bridge.view?.move(effect.extent)
      case "settle":
        return settle(effect)
      case "scroll":
        return scrollBy(effect.delta)
      case "fling-scroll":
        return fling(effect.velocity)
      case "snap": {
        targetId = effect.id
        const value = valueOf(effect.id)
        return value === null || options.onSnap(value, effect.reason)
      }
      case "dismiss":
        if (effect.reason === "swipe") {
          closing = "swipe"
          options.onDismiss()
        }
        return
      case "attempt-dismiss":
        return options.onDismissAttempt()
    }
  }

  function settle(effect: Extract<SheetEffect, { type: "settle" }>) {
    const settling = ++settles
    shown = effect.to
    const view = bridge.view
    if (
      !view ||
      (Math.abs(effect.to - effect.from) < 0.5 && !effect.velocity)
    ) {
      view?.move(effect.to)
      return finishSettle()
    }
    const solver = solveSpring(
      effect.response,
      effect.dampingRatio,
      effect.from - effect.to,
      effect.velocity
    )
    view.settle(
      {
        from: effect.from,
        to: effect.to,
        duration: settleTime(solver),
        extentAt: (elapsed) => effect.to + solver.position(elapsed),
      },
      () => settling === settles && finishSettle()
    )
  }

  function finishSettle() {
    dispatch({ type: "settled" })
    if (state.phase !== "idle") {
      return
    }
    if (state.restingIndex < 0) {
      closing = null
      targetId = null
      return options.onRest(null)
    }
    targetId = config.snapPoints[state.restingIndex].id
    options.onRest(valueOf(targetId))
  }

  function scrollBy(delta: number) {
    if (!touch?.area) {
      return false
    }
    const { area } = touch
    const position = Math.min(area.max, Math.max(0, touch.scroll + delta))
    if (position !== touch.scroll) {
      touch.scroll = position
      area.scrollTo(position)
    }
    return true
  }

  function fling(velocity: number) {
    const area = touch?.area
    if (!area) {
      return
    }
    let position = touch!.scroll
    const start = now()
    let travelled = 0
    const step = () => {
      const elapsed = now() - start
      const total =
        (velocity * (contentDecelerationRate ** elapsed - 1)) /
        Math.log(contentDecelerationRate)
      position = Math.min(area.max, Math.max(0, position + total - travelled))
      travelled = total
      area.scrollTo(position)
      const stopped =
        Math.abs(velocity * contentDecelerationRate ** elapsed) < 0.01 ||
        position <= 0 ||
        position >= area.max
      coast = stopped ? 0 : requestAnimationFrame(step)
    }
    coast = requestAnimationFrame(step)
  }

  function scrollContext() {
    if (!touch?.area) {
      return null
    }
    return {
      atStart: touch.scroll <= 0.5,
      atEnd: touch.scroll >= touch.area.max - 1,
    }
  }

  // Where the backdrop's dim and an outlet's keyframes run, as in `curves.ts`.
  function rangesOf(extents: number[]) {
    const undimmed = findSnapIndex(resolved, options.modalAbove() ?? null)
    const dim: [number, number] =
      undimmed < 0
        ? [0, extents[0]]
        : [extents[undimmed], extents[undimmed + 1] ?? extents[undimmed]]
    const expand: [number, number] = [
      extents.length > 1 ? extents[extents.length - 2] : 0,
      extents[extents.length - 1],
    ]
    return { dim, expand }
  }

  function idOf(point: SnapPoint | null) {
    const index = findSnapIndex(resolved, point)
    return resolved[index >= 0 ? index : 0]?.id
  }

  function open(animate: boolean) {
    const id = idOf(options.snapPoint())
    closing = null
    targetId = id
    const index = config.snapPoints.findIndex((point) => point.id === id)
    if (!animate && index >= 0) {
      state = initialState(config.snapPoints[index].extent, index)
      shown = state.extent
      settles++
      bridge.view?.move(shown)
      return options.onRest(valueOf(id))
    }
    state = initialState(0, -1)
    shown = 0
    settles++
    bridge.view?.move(0)
    dispatch({ type: "snap-to", time: now(), id, reason: "imperative" })
  }

  function relayout(fallback?: string) {
    if (!measure()) {
      return
    }
    if (
      closing ||
      targetId === null ||
      state.phase === "dragging" ||
      state.phase === "pending"
    ) {
      return
    }
    const points = config.snapPoints
    const kept = points.findIndex((point) => point.id === targetId)
    const wanted = points.findIndex((point) => point.id === fallback)
    const index =
      kept >= 0
        ? kept
        : wanted >= 0
          ? wanted
          : nearestIndex(
              points.map((point) => point.extent),
              shown
            )
    if (state.phase === "idle") {
      state = initialState(shown, kept)
    }
    dispatch({
      type: "snap-to",
      time: now(),
      id: points[index].id,
      reason: "content-resize",
    })
  }

  function stopCoast() {
    if (coast) {
      cancelAnimationFrame(coast)
      coast = 0
    }
  }

  function release(velocity: number) {
    if (!touch) {
      return
    }
    const scrolling = state.phase === "scrolling"
    dispatch({ type: "up", time: now(), velocity })
    if (scrolling) {
      fling(-velocity)
    }
    touch = null
  }

  bridge.input = {
    side: () => side,
    layout() {
      if (pendingOpen === null) {
        return relayout(
          resolved[findSnapIndex(resolved, options.snapPoint())]?.id
        )
      }
      if (measure()) {
        const animate = pendingOpen
        pendingOpen = null
        open(animate)
      }
    },
    down(x, y, area) {
      stopCoast()
      if (touch || closing || pendingOpen !== null || state.restingIndex < 0) {
        return false
      }
      const largest = config.snapPoints.at(-1)?.extent ?? 0
      if (area && area.position > 0.5 && shown >= largest - 0.5) {
        return false
      }
      touch = { area, scroll: area?.position ?? 0 }
      axisPoint(side, x, y, point)
      dispatch({
        type: "down",
        time: now(),
        x: point.x,
        y: point.y,
        pointer: "touch",
      })
      return true
    },
    move(x, y) {
      if (!touch) {
        return
      }
      axisPoint(side, x, y, point)
      if (state.phase === "scrolling") {
        scrollBy(state.lastY - point.y)
      }
      dispatch({
        type: "move",
        time: now(),
        x: point.x,
        y: point.y,
        scroll: scrollContext(),
      })
      if (state.phase === "dragging" || state.phase === "scrolling") {
        return "claim"
      }
      if (state.phase === "idle") {
        touch = null
        return "release"
      }
    },
    up(velocity) {
      release(axisPoint(side, velocity.x, velocity.y, { x: 0, y: 0 }).y)
    },
    cancel: () => release(0),
  }

  const sheet: Sheet = {
    element: el,
    parent: options.parent,
    open(animate) {
      if (destroyed) {
        return
      }
      readConfig()
      if (!measure() && !resolved.length) {
        pendingOpen = animate
        return
      }
      open(animate)
    },
    close() {
      const wasClosing = closing
      closing = "close"
      pendingOpen = null
      if (!wasClosing) {
        dispatch({ type: "close", time: now() })
      }
    },
    snapTo(point, reason: SheetSnapReason) {
      const index = findSnapIndex(resolved, point)
      if (index < 0 || resolved[index].id === targetId || closing === "close") {
        return
      }
      closing = null
      dispatch({ type: "snap-to", time: now(), id: resolved[index].id, reason })
    },
    nudge() {
      if (!closing) {
        dispatch({ type: "nudge", time: now() })
      }
    },
    snapPoints: () => resolved,
    target: () => valueOf(closing ? null : targetId),
    isInteractiveAt: (point) =>
      isAtOrBelow(resolved, point, options.modalAbove()),
    refresh() {
      relayout(resolved[findSnapIndex(resolved, options.snapPoint())]?.id)
    },
    destroy() {
      destroyed = true
      settles++
      stopCoast()
      if (dragging) {
        options.onDragChange(false)
      }
      bridge.input = undefined
    },
  }
  return sheet
}

true satisfies Twin<typeof Mirrored, typeof Native>

export {
  attachSheet,
  isDragSurface,
  parentSheet,
  type Sheet,
  sheetLayers,
  type SheetOptions,
}
export type { SheetDriverName } from "./sheet-driver"
export { prepareSheet }
export type { SheetKeyframes, SheetOutlet } from "./sheet-effects"
export type { SheetSide } from "./sheet-axis"
