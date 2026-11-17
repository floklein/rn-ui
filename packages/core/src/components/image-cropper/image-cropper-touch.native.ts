import { nativeHost } from "../../foundation/kernel/native-host"
import type { Part } from "../../foundation/kernel/primitive-types"
import type { Twin } from "../../foundation/kernel/twin"
import type { ImageCropperCropChangeReason } from "./image-cropper"
import type { State } from "./image-cropper-api"
import { type Crop, type Rect, sameCrop } from "./image-cropper-geometry"
import type * as Mirrored from "./image-cropper-touch"
import type { NativeTouchContext } from "./image-cropper-touch"
import type * as Native from "./image-cropper-touch.native"

const isLocked = (state: State) =>
  state.disabled || state.status !== "loaded" || !state.natural || !state.crop

// The calls the web's pointer handlers and the viewport's bind make, for the
// responder's touches and the box the host lays out.
function nativeTouch({
  store,
  setCrop,
  startFrom,
  commit,
}: NativeTouchContext) {
  let gesture: { from: Crop; reason: ImageCropperCropChangeReason } | undefined

  function dragEnd() {
    const ended = gesture
    gesture = undefined
    if (ended) {
      store.set({ dragging: null })
      commit({ reason: ended.reason })
    }
  }

  // Disabling it mid-drag ends the drag where it is, as on the web.
  store.subscribe(() => {
    if (gesture && isLocked(store.get())) {
      dragEnd()
    }
  })

  return {
    setBox(box: Rect) {
      const now = store.get().box
      if (
        now?.left !== box.left ||
        now.top !== box.top ||
        now.width !== box.width ||
        now.height !== box.height
      ) {
        store.set({ box })
      }
    },
    dragStart(
      dragging: State["dragging"],
      reason: ImageCropperCropChangeReason
    ) {
      const state = store.get()
      if (isLocked(state)) {
        return
      }
      gesture = { from: state.crop!, reason }
      startFrom(state.crop)
      store.set({ dragging })
    },
    dragTo(crop: Crop, reason: ImageCropperCropChangeReason) {
      if (!gesture || isLocked(store.get())) {
        return false
      }
      gesture.reason = reason
      return setCrop(crop, { reason })
    },
    dragEnd,
    dragCancel() {
      const ended = gesture
      gesture = undefined
      if (!ended) {
        return
      }
      store.set({ dragging: null })
      const now = store.get().crop
      if (now && !sameCrop(now, ended.from)) {
        setCrop(ended.from, { reason: ended.reason })
      }
      commit({ reason: ended.reason })
    },
  }
}

function focusSelection(
  _element: (slot: string) => HTMLElement | undefined,
  parts: () => Iterable<Part>
) {
  for (const part of parts()) {
    if (part.slot === "selection") {
      nativeHost()?.focus(part)
      return
    }
  }
}

true satisfies Twin<typeof Mirrored, typeof Native>

export { focusSelection, nativeTouch }
export type { NativeTouch, NativeTouchContext } from "./image-cropper-touch"
