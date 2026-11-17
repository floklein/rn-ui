import type { Part } from "@ui-sdk/core"
import { placeNative } from "@ui-sdk/core/native"
import * as React from "react"
import {
  Dimensions,
  type HostInstance,
  I18nManager,
  Keyboard,
  StyleSheet,
} from "react-native"
import { views } from "./native-host"
import { type Host, onTouch } from "./overlay-host"

type Rect = { x: number; y: number; width: number; height: number }
type PopupApi = Parameters<typeof placeNative>[0]
type Placed = ReturnType<typeof placeNative>

/**
 * What a popup's content is placed against on native: a view, like a ref's
 * `current`, or a point in window coordinates, like a touch's `pageX` and
 * `pageY`. Read on every check, so it can move.
 * @experimental
 */
type NativeAnchor = HostInstance | { x: number; y: number }

type Placement = {
  placed: Placed | undefined
  content: { current: HostInstance | null }
  arrow: { current: HostInstance | null }
  wake: () => void
  listeners: Set<() => void>
}

const placements = new WeakMap<object, Placement>()

function placementOf(api: object) {
  let placement = placements.get(api)
  if (!placement) {
    placement = {
      placed: undefined,
      content: { current: null },
      arrow: { current: null },
      wake: () => {},
      listeners: new Set(),
    }
    placements.set(api, placement)
  }
  return placement
}

// Fabric measures synchronously, so a layout effect places the popup before
// its first frame is drawn.
function measure(view: HostInstance | null | undefined) {
  let box: Rect | undefined
  view?.measureInWindow((x, y, width, height) => {
    box = { x, y, width, height }
  })
  return box
}

function anchorBox({ internal }: PopupApi) {
  const setting = (internal.control.anchor() ??
    internal.contentProps().anchor) as NativeAnchor | null | undefined
  if (setting && "measureInWindow" in setting) {
    return measure(setting)
  }
  if (setting) {
    return { x: setting.x, y: setting.y, width: 0, height: 0 }
  }
  const key = internal.store.get().trigger
  let trigger: Part | undefined
  for (const part of internal.parts()) {
    if (part.slot === internal.triggerSlot) {
      trigger ??= part
      if (part.key === key) {
        trigger = part
      }
    }
  }
  return trigger && measure(views.get(trigger))
}

function borderOf(style: unknown) {
  const flat =
    typeof style === "function"
      ? {}
      : (StyleSheet.flatten(style as never) ?? {})
  const all = flat.borderWidth ?? 0
  const start = flat.borderStartWidth ?? flat.borderLeftWidth ?? all
  const end = flat.borderEndWidth ?? flat.borderRightWidth ?? all
  return {
    left: I18nManager.isRTL ? end : start,
    top: flat.borderTopWidth ?? all,
    right: I18nManager.isRTL ? start : end,
    bottom: flat.borderBottomWidth ?? all,
  }
}

const stillFrames = 3
const slowCheck = 500

// Measures the anchor, the popup and its arrow in the coordinates of the host
// it renders in, and places it in the space the host leaves, less its insets
// and the keyboard, counted once. While open it measures again as the web
// does, every frame while anything moves and at a slow pace otherwise, since
// React Native reports no scroll it isn't part of.
function usePlacement(api: PopupApi, host: Host | null, style: unknown) {
  const placement = placementOf(api)
  const border = borderOf(style)
  const borderKey = Object.values(border).join()
  React.useLayoutEffect(() => {
    let last = ""
    function check() {
      const origin = host?.view.current
        ? measure(host.view.current)
        : { x: 0, y: 0, ...Dimensions.get("window") }
      const anchor = anchorBox(api)
      const popup = measure(placement.content.current)
      if (!origin || !anchor || !popup) {
        return false
      }
      const arrow = measure(placement.arrow.current)
      const insets = host?.insets() ?? { top: 0, right: 0, bottom: 0, left: 0 }
      const keyboard = Keyboard.metrics()
      const bottom = Math.min(
        origin.height - insets.bottom,
        keyboard ? keyboard.screenY - origin.y : Infinity
      )
      const key = [
        ...Object.values(origin),
        ...Object.values(anchor),
        popup.width,
        popup.height,
        arrow?.width,
        arrow?.height,
        ...Object.values(insets),
        bottom,
        borderKey,
        JSON.stringify(api.internal.contentProps(), [
          "side",
          "align",
          "sideOffset",
          "alignOffset",
          "collisionPadding",
          "arrowPadding",
        ]),
      ].join()
      if (key === last) {
        return false
      }
      last = key
      placement.placed = placeNative(api, {
        anchor: { ...anchor, x: anchor.x - origin.x, y: anchor.y - origin.y },
        popup: { width: popup.width, height: popup.height },
        arrow,
        border,
        viewport: {
          x: insets.left,
          y: insets.top,
          width: origin.width - insets.left - insets.right,
          height: bottom - insets.top,
        },
        rtl: I18nManager.isRTL,
      })
      placement.listeners.forEach((listener) => listener())
      return true
    }

    let frame = 0
    let still = 0
    function loop() {
      frame = 0
      still = check() ? 0 : still + 1
      if (still < stillFrames) {
        frame = requestAnimationFrame(loop)
      }
    }
    function wake() {
      still = 0
      frame ||= requestAnimationFrame(loop)
    }
    placement.wake = wake
    check()
    wake()
    const slow = setInterval(() => frame || (check() && wake()), slowCheck)
    const offTouch = onTouch(wake)
    const keyboard = ["keyboardDidShow", "keyboardDidHide"].map((name) =>
      Keyboard.addListener(name as "keyboardDidShow", wake)
    )
    const dimensions = Dimensions.addEventListener("change", wake)
    return () => {
      cancelAnimationFrame(frame)
      clearInterval(slow)
      offTouch()
      keyboard.forEach((listener) => listener.remove())
      dimensions.remove()
      placement.wake = () => {}
      placement.placed = undefined
    }
  }, [api, host, placement, borderKey])
  React.useLayoutEffect(() => placement.wake())
  return placement
}

function usePlaced(placement: Placement) {
  return React.useSyncExternalStore(
    (listener) => {
      placement.listeners.add(listener)
      return () => {
        placement.listeners.delete(listener)
      }
    },
    () => placement.placed
  )
}

// `left` and `right` mean start and end right to left, where React Native
// swaps them, and measurements are physical.
const fromLeft = (offset: number) =>
  I18nManager.isRTL ? { right: offset } : { left: offset }

export {
  fromLeft,
  type NativeAnchor,
  type Placement,
  placementOf,
  usePlaced,
  usePlacement,
}
