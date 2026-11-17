import type { PhysicalSide } from "../platform/sides"

/**
 * The shared spring a sheet settles with, from one extent to another in px
 * from its edge: `extentAt` the elapsed ms, landing after `duration` ms.
 * @experimental
 */
type NativeSheetSpring = {
  from: number
  to: number
  duration: number
  extentAt: (elapsed: number) => number
}

/**
 * The extents over which the backdrop dims, from 0 to 1, and over which an
 * outlet plays its keyframes, from the first to the last.
 * @experimental
 */
type NativeSheetRanges = { dim: [number, number]; expand: [number, number] }

/**
 * The scroll view under a touch on a sheet: how far it's scrolled forward,
 * away from the sheet's edge, and how far it can go, in px.
 * @experimental
 */
type NativeScrollArea = {
  position: number
  max: number
  /** Scrolls it to `position`, forward from its start. */
  scrollTo: (position: number) => void
}

/**
 * What the native host does for a sheet: its sizes, and moving its view.
 * @experimental
 */
type NativeSheetView = {
  /** The screen's and the sheet's own size along its axis, once both are laid out. */
  measure: () => { container: number; content: number } | undefined
  /** Shows the sheet `extent` px out from its edge, stopping any settle. */
  move: (extent: number) => void
  /** Plays the spring and calls `done` when it lands, unless a move or another settle stops it first. */
  settle: (spring: NativeSheetSpring, done: () => void) => void
  /** The snap points resolved again, which moves these ranges. */
  ranges: (ranges: NativeSheetRanges) => void
}

/**
 * What the native host feeds a sheet: its layout and one finger's touch, at
 * its position on screen. `down` answers whether the sheet takes the touch:
 * when it doesn't, a scroll view under it scrolls on its own. When it does,
 * the host keeps that scroll view from scrolling and the sheet scrolls it.
 * `move` answers whether the sheet is now dragging or scrolling, so the host
 * claims the touch, or let it go.
 * @experimental
 */
type NativeSheetInput = {
  side: () => PhysicalSide
  /** The sheet or its container changed size. */
  layout: () => void
  down: (x: number, y: number, area: NativeScrollArea | null) => boolean
  move: (x: number, y: number) => "claim" | "release" | undefined
  /** The finger lifted at `velocity` px/ms, on screen. */
  up: (velocity: { x: number; y: number }) => void
  cancel: () => void
}

type Bridge = { view?: NativeSheetView; input?: NativeSheetInput }

const bridges = new WeakMap<object, Bridge>()

/**
 * Where a drawer's native sheet and the host meet, by the drawer's api: the
 * host sets `view` and calls `input`, which the sheet sets while attached.
 * @experimental
 */
function nativeSheet(api: object) {
  let bridge = bridges.get(api)
  if (!bridge) {
    bridge = {}
    bridges.set(api, bridge)
  }
  return bridge
}

export {
  nativeSheet,
  type NativeScrollArea,
  type NativeSheetInput,
  type NativeSheetRanges,
  type NativeSheetSpring,
  type NativeSheetView,
}
