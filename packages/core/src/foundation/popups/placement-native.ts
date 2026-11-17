import {
  anchorRect,
  arrowOffset,
  computeArrow,
  computePlacement,
  transformOrigin,
} from "../platform/position"
import type { createPopup } from "./create-popup"

type Rect = { x: number; y: number; width: number; height: number }
type Size = { width: number; height: number }
type Edges = { left: number; top: number; right: number; bottom: number }

type PopupApi = { internal: ReturnType<typeof createPopup>["internal"] }

/**
 * What `position` writes on the DOM host, for the native host, which
 * measures the views itself: where the popup goes, the fields that become
 * its content's and its arrow's state, and where the arrow sits along the
 * popup's edge. Every box is in the coordinates of the host the popup
 * renders in; `viewport` is the space it may use, less insets and keyboard.
 * @experimental
 */
function placeNative(
  api: PopupApi,
  measured: {
    anchor: Rect
    popup: Size
    viewport: Rect
    rtl: boolean
    border?: Edges
    arrow?: Size
  }
) {
  const { preset, contentProps } = api.internal
  const { popup, viewport, rtl, border, arrow } = measured
  const options = preset.placement!.options(contentProps(), {
    side: preset.side,
    align: "center",
  })
  const result = computePlacement(measured.anchor, popup, viewport, {
    side: options.side,
    align: options.align,
    sideOffset: Number(options.sideOffset),
    alignOffset: Number(options.alignOffset),
    collisionPadding: Number(options.collisionPadding ?? 8),
    rtl,
  })
  const anchor = anchorRect(measured.anchor)
  const arrowPadding = Number(options.arrowPadding ?? 6)
  const [originX, originY] = transformOrigin(
    result.side,
    result.align,
    rtl,
    anchor,
    popup,
    result
  )
  const paddingBox = {
    x: result.x + (border?.left ?? 0),
    y: result.y + (border?.top ?? 0),
    width: popup.width - (border ? border.left + border.right : 0),
    height: popup.height - (border ? border.top + border.bottom : 0),
  }
  const pointed =
    arrow &&
    computeArrow(
      anchor,
      { ...paddingBox, width: popup.width, height: popup.height },
      arrow,
      result.side,
      arrowPadding
    )
  return {
    x: result.x,
    y: result.y,
    state: {
      side: result.side,
      align: result.align,
      anchorWidth: anchor.width,
      anchorHeight: anchor.height,
      availableWidth: result.available.width,
      availableHeight: result.available.height,
      transformOrigin: `${Math.round(originX)}px ${Math.round(originY)}px`,
      arrowOffset: arrowOffset(anchor, paddingBox, result.side, arrowPadding),
    },
    arrow: pointed && {
      offset: pointed.offset,
      side: result.side,
      align: result.align,
      arrowClamped: pointed.clamped,
    },
  }
}

export { placeNative }
