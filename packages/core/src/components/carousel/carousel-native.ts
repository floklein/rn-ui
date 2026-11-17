import { nativeElement } from "../../foundation/kernel/native-element"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import type { Part } from "../../foundation/kernel/primitive-types"
import type { CarouselApi } from "./carousel-api"

type Layout = { x: number; y: number; width: number; height: number }

type Track = {
  offset: number
  listeners: Set<() => void>
  layouts: Map<string, Layout>
}

const tracks = new WeakMap<object, Track>()

function trackOf(api: object) {
  let track = tracks.get(api)
  if (!track) {
    track = { offset: 0, listeners: new Set(), layouts: new Map() }
    tracks.set(api, track)
  }
  return track
}

const layoutKey = (slot: string, key = "") => `${slot}:${key}`

/** A part's layout in its parent, as its view last reported it. */
const layoutOf = (api: object, slot: string, key?: string) =>
  tracks.get(api)?.layouts.get(layoutKey(slot, key))

/** Moves the content to `offset` along the axis, past either end when stretched. */
function moveTrack(api: object, offset: number) {
  const track = trackOf(api)
  if (track.offset === offset) {
    return
  }
  track.offset = offset
  track.listeners.forEach((listener) => listener())
}

/**
 * What the native host tells a carousel, which reads no layout itself, and
 * reads back to move its content.
 * @experimental
 */
type NativeCarousel = {
  /** The layout a part's view reported in its parent: the viewport's, the content's, or a slide's by its `id`. */
  layout: (
    slot: "viewport" | "content" | "item",
    key: string | undefined,
    layout: Layout
  ) => void
  /** How far the content has moved from its start along the axis, beyond either end while a drag stretches it. */
  offset: () => number
  subscribe: (listener: () => void) => () => void
}

/**
 * A carousel's layout and motion on the native host, by its api.
 * @experimental
 */
function nativeCarousel(api: CarouselApi): NativeCarousel {
  const track = trackOf(api)
  return {
    layout(slot, key, layout) {
      const at = layoutKey(slot, key)
      const before = track.layouts.get(at)
      if (
        before &&
        before.x === layout.x &&
        before.y === layout.y &&
        before.width === layout.width &&
        before.height === layout.height
      ) {
        return
      }
      track.layouts.set(at, layout)
      api.internal.measure()
    },
    offset: () => track.offset,
    subscribe(listener) {
      track.listeners.add(listener)
      return () => {
        track.listeners.delete(listener)
      }
    },
  }
}

const connected = (part: Part) =>
  Object.assign(nativeElement(part), { isConnected: true })

/**
 * Carousel's behavior on the native host, as its binds do on the DOM host:
 * the root runs rotation, the viewport follows touch drags, and slides and
 * indicators join in render order.
 * @experimental
 */
const carouselNative: NativeBehavior<CarouselApi> = {
  root: (part) => part.api.internal.bindRoot(nativeElement(part)),
  viewport: (part) => part.api.internal.bindViewport(connected(part)),
  item(part) {
    const unbind = part.api.internal.bindItem(connected(part), part.key)
    return () => {
      unbind()
      tracks.get(part.api)?.layouts.delete(layoutKey("item", part.key))
    }
  },
  indicator: (part) =>
    part.api.internal.bindIndicator(nativeElement(part), part),
}

export {
  carouselNative,
  layoutOf,
  moveTrack,
  nativeCarousel,
  type NativeCarousel,
}
