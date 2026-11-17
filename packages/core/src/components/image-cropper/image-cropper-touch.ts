import type {
  Part,
  PrimitiveContext,
} from "../../foundation/kernel/primitive-types"
import type {
  ImageCropperCropChangeReason,
  ImageCropperOptions,
} from "./image-cropper"
import type { State } from "./image-cropper-api"
import type { Crop, Rect } from "./image-cropper-geometry"

type Details = { reason: ImageCropperCropChangeReason }

type NativeTouchContext = {
  store: PrimitiveContext<ImageCropperOptions, State, string>["store"]
  setCrop: (crop: Crop, details: Details) => boolean
  startFrom: (crop: Crop | null) => void
  commit: (details: Details) => void
}

type NativeTouch = {
  /** The viewport's content box, as the host lays it out. */
  setBox: (box: Rect) => void
  /** Starts a touch drag at the crop shown now, marking what it drags. */
  dragStart: (dragging: State["dragging"], reason: Details["reason"]) => void
  /** Moves the crop during it, and returns whether it changed. */
  dragTo: (crop: Crop, reason: Details["reason"]) => boolean
  /** The touch lifted: the crop commits if it changed. */
  dragEnd: () => void
  /** The touch was taken away: the crop goes back and nothing commits. */
  dragCancel: () => void
}

/**
 * What a native touch calls, as api methods. Empty on the web, where the
 * parts' pointer handlers and binds do it; its native twin has them.
 */
function nativeTouch(_context: NativeTouchContext) {
  return {} as NativeTouch
}

/** Focuses the selection. */
function focusSelection(
  element: (slot: string) => HTMLElement | undefined,
  _parts: () => Iterable<Part>
) {
  element("selection")?.focus()
}

export {
  focusSelection,
  nativeTouch,
  type NativeTouch,
  type NativeTouchContext,
}
