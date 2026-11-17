import type { Twin } from "../../foundation/kernel/twin"
import { createNativeScrollView } from "./scroll-area-native"
import type * as Mirrored from "./scroll-area-view"
import type * as Native from "./scroll-area-view.native"

type ScrollAreaModel = Mirrored.ScrollAreaModel
type ScrollAreaScrollOptions = Mirrored.ScrollAreaScrollOptions

const liveKeys: (keyof ScrollAreaModel)[] = [
  "atXStart",
  "atXEnd",
  "atYStart",
  "atYEnd",
  "scrollingX",
  "scrollingY",
  "hovering",
  "visibleX",
  "visibleY",
  "dragging",
  "sticking",
]

const createScrollView = createNativeScrollView

true satisfies Twin<typeof Mirrored, typeof Native, "createScrollView">

export {
  createScrollView,
  liveKeys,
  type ScrollAreaModel,
  type ScrollAreaScrollOptions,
}
