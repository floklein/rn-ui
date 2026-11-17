import type { Store } from "../../foundation/kernel/store"
import {
  draggedPosition,
  edgesOf,
  edgeTolerance,
  followsEnd,
  mainAxis,
  maxScroll,
  overflows,
  pageDirection,
  pageLength,
  scrollbarShown,
  thumbGeometry,
  type Axis,
  type AxisMetrics,
} from "./scroll-area-model"
import type {
  ScrollAreaModel,
  ScrollAreaScrollOptions,
} from "./scroll-area-view"

/**
 * What the native host does for a scroll area's viewport.
 * @experimental
 */
type NativeScroller = {
  /** Scrolls the viewport to `position` px from its start along `axis`. */
  scrollTo: (axis: Axis, position: number, animated: boolean) => void
}

/**
 * What the viewport reports, in px: how far it's scrolled from its start
 * along each axis, its own size and its content's. Each report may leave
 * out what didn't change.
 * @experimental
 */
type NativeScrollReport = {
  offset?: { x: number; y: number }
  size?: { width: number; height: number }
  content?: { width: number; height: number }
}

/**
 * A thumb's length and its offset from the start of its scrollbar, in px.
 * @experimental
 */
type NativeThumb = { size: number; offset: number }

const scrollEndDelay = 150

const axes = ["x", "y"] as const

const names = {
  x: {
    overflow: "overflowX",
    atStart: "atXStart",
    atEnd: "atXEnd",
    scrolling: "scrollingX",
    visible: "visibleX",
    scrollbars: "scrollbarsX",
  },
  y: {
    overflow: "overflowY",
    atStart: "atYStart",
    atEnd: "atYEnd",
    scrolling: "scrollingY",
    visible: "visibleY",
    scrollbars: "scrollbarsY",
  },
} as const

const none = () => {}

const views = new WeakSet<object>()

/**
 * A scroll area's engine on the native host, which `nativeScrollView(api)`
 * returns: what the host reports to it, and the thumbs' geometry it hands out.
 * @experimental
 */
type NativeScrollView = ReturnType<typeof createNativeScrollView>

type Flag = {
  [Key in keyof ScrollAreaModel]: ScrollAreaModel[Key] extends boolean
    ? Key
    : never
}[keyof ScrollAreaModel]

function createNativeScrollView(store: Store<ScrollAreaModel>) {
  let scroller: NativeScroller | undefined
  const metrics: Record<Axis, AxisMetrics> = {
    x: { position: 0, client: 0, scroll: 0 },
    y: { position: 0, client: 0, scroll: 0 },
  }
  const previous = { x: Number.NaN, y: Number.NaN }
  const track = { x: 0, y: 0 }
  const thumbs: Record<Axis, NativeThumb> = {
    x: { size: 0, offset: 0 },
    y: { size: 0, offset: 0 },
  }
  const watchers = new Set<() => void>()
  const scrollbars = { x: 0, y: 0 }
  const scrollEnds = { x: 0, y: 0 }
  const lastScroll = { x: 0, y: 0 }
  const hideTimers = { x: 0, y: 0 }
  let stuckTo = Number.NaN
  let touching = false
  let drag: { axis: Axis; from: number; at: number } | undefined

  function update({ resized = false } = {}) {
    if (resized) {
      follow()
    }
    const state = store.get()
    let patch: Partial<ScrollAreaModel> | undefined
    const set = <Key extends keyof ScrollAreaModel>(
      key: Key,
      value: ScrollAreaModel[Key]
    ) => {
      if (state[key] !== value) {
        ;(patch ??= {})[key] = value
      }
    }
    for (const axis of axes) {
      const axisMetrics = metrics[axis]
      const name = names[axis]
      const delta = Number.isNaN(previous[axis])
        ? 0
        : axisMetrics.position - previous[axis]
      previous[axis] = axisMetrics.position
      const edges = edgesOf(axisMetrics)
      set(name.overflow, overflows(axisMetrics))
      set(name.atStart, edges.atStart)
      set(name.atEnd, edges.atEnd)
      placeThumb(axis)
      if (delta === 0) {
        continue
      }
      const ownScroll =
        axis === "y" && Math.abs(axisMetrics.position - stuckTo) < edgeTolerance
      if (!ownScroll) {
        lastScroll[axis] = performance.now()
        set(name.scrolling, true)
        scrollEnds[axis] ||= setTimeout(
          () => endScroll(axis),
          scrollEndDelay
        ) as unknown as number
      }
      if (axis === "y" && state.stickToEnd) {
        set(
          "sticking",
          followsEnd(state.sticking, { delta, after: edges.after })
        )
      }
    }
    if (patch) {
      store.set(patch)
    }
    if (patch || resized) {
      refreshVisibility()
    }
  }

  function placeThumb(axis: Axis) {
    const next = thumbGeometry(metrics[axis], track[axis])
    const thumb = thumbs[axis]
    if (
      Math.abs(next.size - thumb.size) < 0.01 &&
      Math.abs(next.offset - thumb.offset) < 0.01
    ) {
      return
    }
    thumbs[axis] = next
    watchers.forEach((watcher) => watcher())
  }

  function endScroll(axis: Axis) {
    const elapsed = performance.now() - lastScroll[axis]
    if (elapsed < scrollEndDelay) {
      scrollEnds[axis] = setTimeout(
        () => endScroll(axis),
        scrollEndDelay - elapsed
      ) as unknown as number
      return
    }
    scrollEnds[axis] = 0
    setFlag(names[axis].scrolling, false)
    refreshVisibility()
  }

  function setFlag(key: Flag, value: boolean) {
    if (store.get()[key] !== value) {
      store.set({ [key]: value } as Partial<ScrollAreaModel>)
    }
  }

  function refreshVisibility() {
    const state = store.get()
    for (const axis of axes) {
      const name = names[axis]
      const shown = scrollbarShown(state.type, {
        overflow: state[name.overflow],
        hovering: state.hovering,
        scrolling: state[name.scrolling],
        dragging: state.dragging === axis,
      })
      if (shown) {
        clearTimeout(hideTimers[axis])
        hideTimers[axis] = 0
        setFlag(name.visible, true)
        continue
      }
      if (!state[name.visible] || hideTimers[axis]) {
        continue
      }
      const delay =
        state.type === "scroll" || state.type === "hover"
          ? state.scrollHideDelay
          : 0
      if (delay <= 0) {
        setFlag(name.visible, false)
      } else {
        hideTimers[axis] = setTimeout(() => {
          hideTimers[axis] = 0
          setFlag(name.visible, false)
          refreshVisibility()
        }, delay) as unknown as number
      }
    }
  }

  // Growth never pulls the view from under a finger scrolling it or holding a thumb.
  function follow() {
    const state = store.get()
    if (
      !scroller ||
      !state.stickToEnd ||
      !state.sticking ||
      state.dragging ||
      touching
    ) {
      return
    }
    const max = maxScroll(metrics.y)
    if (max - metrics.y.position < edgeTolerance) {
      return
    }
    stuckTo = max
    scroller.scrollTo("y", max, false)
    metrics.y.position = max
  }

  function setDragging(dragging: Axis | null) {
    store.set({ dragging })
    refreshVisibility()
  }

  const view = {
    bindRoot: (_el: HTMLElement) => none,
    bindViewport: (_el: HTMLElement) => none,
    bindScrollbar: (_el: HTMLElement, _axis: Axis) => none,
    bindThumb: (_el: HTMLElement, _axis: Axis) => none,
    scrollToEdge(
      edge: "start" | "end",
      { behavior = "smooth" }: ScrollAreaScrollOptions = {}
    ) {
      if (!scroller) {
        return
      }
      const axis = mainAxis(store.get())
      if (edge === "end" && axis === "y" && store.get().stickToEnd) {
        setFlag("sticking", true)
      }
      scroller.scrollTo(
        axis,
        edge === "start" ? 0 : maxScroll(metrics[axis]),
        behavior === "smooth"
      )
    },
    isAt(edge: "start" | "end") {
      if (!scroller) {
        return undefined
      }
      const axis = mainAxis({
        overflowX: overflows(metrics.x),
        overflowY: overflows(metrics.y),
      })
      const edges = edgesOf(metrics[axis])
      return edge === "start" ? edges.atStart : edges.atEnd
    },
    // A screen reader keeps its own focus: pressing scroll-to-end moves nothing.
    focusViewport: none,
    refresh() {
      if (scroller) {
        update({ resized: true })
      }
      refreshVisibility()
    },
    /** Hands the engine the mounted viewport, until the cleanup it returns runs. */
    attach(next: NativeScroller) {
      scroller = next
      store.set({ counted: true })
      update({ resized: true })
      return () => {
        for (const axis of axes) {
          clearTimeout(scrollEnds[axis])
          clearTimeout(hideTimers[axis])
          scrollEnds[axis] = hideTimers[axis] = 0
        }
        if (scroller === next) {
          scroller = undefined
        }
      }
    },
    /** What the viewport's scroll events and layouts report. */
    report({ offset, size, content }: NativeScrollReport) {
      if (offset) {
        metrics.x.position = offset.x
        metrics.y.position = offset.y
      }
      if (size) {
        metrics.x.client = size.width
        metrics.y.client = size.height
      }
      if (content) {
        metrics.x.scroll = content.width
        metrics.y.scroll = content.height
      }
      if (scroller) {
        update({ resized: !offset })
      }
    },
    /** A finger starts or stops scrolling the viewport itself. */
    touch(down: boolean) {
      touching = down
      if (!down && scroller) {
        update({ resized: true })
      }
    },
    /** Counts a scrollbar along `axis` while it's mounted, and measures its track. */
    scrollbar(axis: Axis) {
      scrollbars[axis]++
      store.set({ [names[axis].scrollbars]: scrollbars[axis] })
      return () => {
        scrollbars[axis]--
        store.set({ [names[axis].scrollbars]: scrollbars[axis] })
      }
    },
    /** The scrollbar along `axis` is `length` px long. */
    track(axis: Axis, length: number) {
      track[axis] = length
      placeThumb(axis)
    },
    thumb: (axis: Axis) => thumbs[axis],
    /** Calls `watcher` whenever a thumb moves or resizes, until the cleanup it returns runs. */
    watch(watcher: () => void) {
      watchers.add(watcher)
      return () => {
        watchers.delete(watcher)
      }
    },
    /**
     * A finger lands on a scrollbar, `point` px from its start: on the thumb
     * it drags it, and elsewhere it pages toward the finger.
     */
    press(axis: Axis, point: number) {
      const thumb = thumbs[axis]
      const direction = pageDirection(point, thumb)
      if (direction !== 0) {
        const { position, client } = metrics[axis]
        scroller?.scrollTo(
          axis,
          Math.min(
            Math.max(position + direction * pageLength(client), 0),
            maxScroll(metrics[axis])
          ),
          true
        )
        return
      }
      drag = { axis, from: metrics[axis].position, at: point }
      setDragging(axis)
    },
    /** The finger on a thumb moves to `point` px from its scrollbar's start. */
    move(point: number) {
      if (!drag) {
        return
      }
      const { axis, from, at } = drag
      scroller?.scrollTo(
        axis,
        draggedPosition(from, point - at, metrics[axis], track[axis]),
        false
      )
    },
    /** The finger on a scrollbar lifts or is taken. */
    lift() {
      if (drag) {
        drag = undefined
        setDragging(null)
      }
    },
  }
  views.add(view)
  return view
}

/**
 * Where a scroll area's engine and the native host meet, by the scroll
 * area's api: the host hands it the viewport and reports its scrolling and
 * layout, and the thumbs read their geometry from it.
 * @experimental
 */
function nativeScrollView(api: { internal: object }) {
  if (!views.has(api.internal)) {
    throw new Error("nativeScrollView takes a scroll area's api.")
  }
  return api.internal as NativeScrollView
}

export {
  createNativeScrollView,
  type NativeScroller,
  type NativeScrollReport,
  type NativeScrollView,
  type NativeThumb,
  nativeScrollView,
}
