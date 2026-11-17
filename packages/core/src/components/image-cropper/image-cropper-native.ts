import type { ResizeHandle } from "../../foundation/direct-manipulation/resize"
import {
  type NativeBehavior,
  nativeHost,
  type NativeTouch,
} from "../../foundation/kernel/native-host"
import type { Part } from "../../foundation/kernel/primitive-types"
import { isRTL } from "../../foundation/platform/env"
import type {
  ImageCropperHandlePosition,
  ImageCropperHandleProps,
} from "./image-cropper"
import {
  type ImageCropperApi,
  layout,
  type State,
  zoomText,
} from "./image-cropper-api"
import {
  type Crop,
  type Limits,
  type Rect,
  resizeCrop,
  shownSize,
  type Size,
  zoomCrop,
  zoomOf,
} from "./image-cropper-geometry"

type CropperPart = Part<State, ImageCropperApi>
type Point = { x: number; y: number }

const isLocked = (state: State) =>
  state.disabled || state.status !== "loaded" || !state.natural || !state.crop

const limitsOf = (state: State) =>
  ({
    aspect: state.aspectRatio,
    minWidth: state.minWidth,
    minHeight: state.minHeight,
    maxZoom: state.maxZoom,
  }) satisfies Limits

const stateOf = (part: CropperPart) => part.store.get()

// Where the viewport's content box sits inside its view, which `box` measures.
const offsets = new WeakMap<object, Point>()

// A screen reader's step moves as far as Shift with an arrow key does on the
// web: ten points on screen, however large the image is.
const stepPoints = 10

// A drag of the whole selection or of a handle, in a box. It starts on the
// first move, as the web's starts past its threshold, from where the touch
// went down; a cancelled, taken or unmounted responder puts the crop back.
function followResize(part: CropperPart, handle: ResizeHandle) {
  const { api, store } = part
  let down: { touch: Point; crop: Crop; scale: number } | undefined
  let dragging = false
  const stop = nativeHost()?.follow(part, {
    accepts() {
      const state = store.get()
      return !isLocked(state) && state.mode === "box"
    },
    start(touch) {
      const state = store.get()
      const at = layout(state)
      down = at ? { touch, crop: state.crop!, scale: at.scale } : undefined
    },
    move(touch) {
      const state = store.get()
      if (!down || isLocked(state)) {
        return
      }
      if (!dragging) {
        dragging = true
        api.internal.dragStart(handle, "drag")
      }
      api.internal.dragTo(
        resizeCrop(
          down.crop,
          state.natural!,
          handle,
          (touch.x - down.touch.x) / down.scale,
          (touch.y - down.touch.y) / down.scale,
          limitsOf(state)
        ),
        "drag"
      )
    },
    end() {
      down = undefined
      if (dragging) {
        dragging = false
        api.internal.dragEnd()
      }
    },
    cancel() {
      down = undefined
      if (dragging) {
        dragging = false
        api.internal.dragCancel()
      }
    },
  })
  return () => {
    stop?.()
    if (dragging) {
      api.internal.dragCancel()
    }
  }
}

const centerOf = (points: readonly Point[]) => ({
  x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
  y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
})

const spread = (points: readonly Point[]) =>
  Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)

// One finger pans the image under a frame, and two pinch it, from every
// finger the responder reports. A finger going down or lifting starts the
// gesture again from the crop shown then, as the web's pointers do.
function followFrame(part: CropperPart) {
  const { api, store } = part
  let gesture:
    | {
        crop: Crop
        count: number
        center: Point
        distance: number
        scale: number
        selection: Rect
      }
    | undefined
  let active = false
  let reason: "drag" | "pinch" = "drag"

  function begin(points: readonly Point[]) {
    const state = store.get()
    const at = layout(state)
    const box = nativeHost()?.box(part)
    if (!at || !box) {
      gesture = undefined
      return
    }
    const offset = offsets.get(api) ?? { x: 0, y: 0 }
    gesture = {
      crop: state.crop!,
      count: points.length,
      center: centerOf(points),
      distance: points.length > 1 ? spread(points) : 0,
      scale: at.scale,
      selection: {
        ...at.selection,
        left: at.selection.left + box.left + offset.x,
        top: at.selection.top + box.top + offset.y,
      },
    }
  }

  function moveTo(points: readonly Point[]) {
    const state = store.get()
    if (!gesture || isLocked(state)) {
      return
    }
    const natural = state.natural!
    const limits = limitsOf(state)
    const { crop, center, distance, scale, selection } = gesture
    const middle = centerOf(points)
    if (points.length > 1 && distance) {
      reason = "pinch"
      // The image point under the fingers' first middle stays under their middle.
      const anchor = {
        x: crop.x + (center.x - selection.left) / scale,
        y: crop.y + (center.y - selection.top) / scale,
      }
      const zoomed = zoomCrop(
        crop,
        natural,
        zoomOf(crop, natural) * (spread(points) / distance),
        limits,
        anchor
      )
      const k = selection.width / zoomed.width
      api.internal.dragTo(
        resizeCrop(
          zoomed,
          natural,
          "move",
          anchor.x - (middle.x - selection.left) / k - zoomed.x,
          anchor.y - (middle.y - selection.top) / k - zoomed.y,
          limits
        ),
        reason
      )
      return
    }
    api.internal.dragTo(
      resizeCrop(
        crop,
        natural,
        "move",
        (center.x - middle.x) / scale,
        (center.y - middle.y) / scale,
        limits
      ),
      reason
    )
  }

  const stop = nativeHost()?.follow(part, {
    accepts() {
      const state = store.get()
      return !isLocked(state) && state.mode === "frame"
    },
    start(touch) {
      active = true
      reason = "drag"
      gesture = undefined
      api.internal.dragStart("pan", reason)
      begin([touch])
    },
    move() {},
    fingers(points) {
      if (!active || !points.length) {
        return
      }
      if (!gesture || points.length !== gesture.count) {
        begin(points)
        return
      }
      moveTo(points)
    },
    end() {
      active = false
      gesture = undefined
      api.internal.dragEnd()
    },
    cancel() {
      active = false
      gesture = undefined
      api.internal.dragCancel()
    },
  })
  return () => {
    stop?.()
    if (active) {
      active = false
      api.internal.dragCancel()
    }
  }
}

// The zoom track: a touch jumps the zoom there, and a drag follows it.
function followZoom(part: CropperPart) {
  const { api, store } = part
  let box: Rect | undefined
  let dragging = false
  const to = (touch: NativeTouch) => {
    const state = store.get()
    if (!box?.width || isLocked(state)) {
      return
    }
    const across = Math.min(1, Math.max(0, (touch.x - box.left) / box.width))
    const fraction = isRTL(null) ? 1 - across : across
    api.internal.dragTo(
      zoomCrop(
        state.crop!,
        state.natural!,
        1 + fraction * (state.maxZoom - 1),
        limitsOf(state)
      ),
      "zoom-input"
    )
  }
  const stop = nativeHost()?.follow(part, {
    accepts: () => !isLocked(store.get()),
    start(touch) {
      box = nativeHost()?.box(part)
      dragging = true
      api.internal.dragStart(null, "zoom-input")
      to(touch)
    },
    move: to,
    end() {
      dragging = false
      api.internal.dragEnd()
    },
    cancel() {
      dragging = false
      api.internal.dragCancel()
    },
  })
  return () => {
    stop?.()
    if (dragging) {
      api.internal.dragCancel()
    }
  }
}

// What a screen reader's increment does to each handle: it grows what the
// handle's value reads, its crop's height or width.
const grows: Record<ImageCropperHandlePosition, readonly [number, number]> = {
  n: [0, -1],
  s: [0, 1],
  e: [1, 0],
  w: [-1, 0],
  ne: [1, 0],
  se: [1, 0],
  nw: [-1, 0],
  sw: [-1, 0],
}

function adjust(part: CropperPart, handle: ResizeHandle) {
  const [x, y] = handle === "move" ? [1, 0] : grows[handle]
  return nativeHost()?.adjustable(part, (direction) => {
    const state = stateOf(part)
    const at = layout(state)
    if (isLocked(state) || !at) {
      return
    }
    const by = (direction * stepPoints) / at.scale
    part.api.setCrop(
      resizeCrop(
        state.crop!,
        state.natural!,
        handle,
        x * by,
        y * by,
        limitsOf(state)
      ),
      { reason: "step-key" }
    )
  })
}

const positionOf = (part: CropperPart) =>
  (part.props as ImageCropperHandleProps).position

function both(...cleanups: ((() => void) | undefined)[]) {
  return () => {
    for (const cleanup of cleanups) {
      cleanup?.()
    }
  }
}

/**
 * Image Cropper's behavior on the native host, as its binds and pointer
 * handlers do on the DOM host: in a box the selection and each handle follow
 * touch drags, in a frame the viewport pans with one finger and zooms with
 * two, the zoom track follows touches, and the selection, each handle and
 * the zoom take a screen reader's increment and decrement.
 * @experimental
 */
const imageCropperNative: NativeBehavior<ImageCropperApi> = {
  viewport: followFrame,
  selection: (part: CropperPart) =>
    both(followResize(part, "move"), adjust(part, "move")),
  handle: (part: CropperPart) =>
    both(followResize(part, positionOf(part)), adjust(part, positionOf(part))),
  zoom: (part: CropperPart) =>
    both(
      followZoom(part),
      nativeHost()?.adjustable(part, (direction) => {
        const state = stateOf(part)
        part.api.setZoom(
          zoomText(state) + (direction * (state.maxZoom - 1)) / 10,
          { reason: "zoom-input" }
        )
      })
    ),
}

/**
 * What the native adapter tells an image cropper, which reads no element,
 * and what it draws the parts with, where the web writes inline styles and
 * a CSS variable.
 * @experimental
 */
function nativeImageCropper(api: ImageCropperApi) {
  return {
    /** The image loaded, at the size `Image` reports. */
    load: ({ width, height }: Size) =>
      api.internal.loaded({
        naturalWidth: width,
        naturalHeight: height,
      } as HTMLImageElement),
    /** The image failed to load. */
    fail: () => api.internal.failed(),
    /** The viewport's content laid out at `frame`, inside the viewport's view. */
    measure(frame: { x: number; y: number; width: number; height: number }) {
      offsets.set(api, { x: frame.x, y: frame.y })
      api.internal.setBox({
        left: 0,
        top: 0,
        width: frame.width,
        height: frame.height,
      })
    },
    /**
     * Where the image and the selection show inside the viewport's content,
     * or `undefined` until the image and the viewport have sizes. The image's
     * box is its own, before it's turned about its middle and flipped.
     */
    place(state: object) {
      const held = state as State
      const at = layout(held)
      if (!at) {
        return undefined
      }
      const { crop, natural } = held as State & { crop: Crop; natural: Size }
      const width = natural.width * at.scale
      const height = natural.height * at.scale
      return {
        image: {
          left: at.image.left + (at.image.width - width) / 2,
          top: at.image.top + (at.image.height - height) / 2,
          width,
          height,
          transform: [
            { scaleX: crop.flipX ? -1 : 1 },
            { scaleY: crop.flipY ? -1 : 1 },
            { rotate: `${crop.rotation}deg` },
          ],
        },
        selection: at.selection,
      }
    },
    /** The image's width over its height as it shows, turned: the web's `--image-cropper-aspect-ratio`. */
    aspectRatio(state: object) {
      const { crop, natural } = state as State
      if (!crop || !natural) {
        return undefined
      }
      const shown = shownSize(natural, crop.rotation)
      return shown.width / shown.height
    },
    /** Where the zoom sits along its track, from 0 to 100. */
    zoomPosition(state: object) {
      const held = state as State
      return held.maxZoom > 1
        ? ((zoomText(held) - 1) / (held.maxZoom - 1)) * 100
        : 0
    },
  }
}

export { imageCropperNative, nativeImageCropper }
