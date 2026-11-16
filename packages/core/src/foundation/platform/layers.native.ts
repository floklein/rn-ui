import { nativeHost, type NativeInput } from "../kernel/native-host"
import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./layers"
import type * as Native from "./layers.native"

// The DOM's layer hears Android's back through a close watcher in
// `popups/popup.ts`, and Escape and outside presses with their events. The
// native host's input has no event, so a native layer adds its own hooks.
type Layer = Mirrored.Layer & {
  onBack?: () => void
  // `within` is the api of the popup whose content the gesture reached.
  onEscapeGesture?: (within?: object) => void
  onBackdropPress?: () => void
}

const stack: Layer[] = []
const persistent = new Set<Element>()
let pushed = 0
let escapeAt = -Infinity
let closed: HTMLElement | undefined
let stopListening: (() => void) | undefined

const active = () => stack.filter((layer) => layer.active())

function activeLayers() {
  return active()
}

function layerCount() {
  return pushed
}

function openedSince(order: number) {
  return active().some((layer) => (layer.order ?? 0) > order)
}

function lastEscape() {
  return escapeAt
}

function persistentLayers() {
  return [...persistent]
}

function bindPersistentLayer(el: Element) {
  persistent.add(el)
  return () => {
    persistent.delete(el)
  }
}

function inPersistentLayer(target: Node) {
  return persistent.has(target as Element)
}

// check-code: allow return-type recursive, so TypeScript cannot infer it.
function layerContains(layer: Layer, target: Node): boolean {
  return (
    layer.contains(target) ||
    active().some(
      (other) => other.parent === layer && layerContains(other, target)
    )
  )
}

function findLayer(target: Node) {
  return active()
    .reverse()
    .find((layer) => layer.contains(target))
}

function markClosed(target: HTMLElement | undefined) {
  closed = target
  setTimeout(() => {
    if (closed === target) {
      closed = undefined
    }
  })
}

function lastClosed() {
  return closed
}

// The topmost open layer takes back and escape. A layer that refuses still
// takes them, so back never falls through to navigation while one is open.
function toTopmost(deliver: (layer: Layer) => void) {
  const layer = active().at(-1)
  if (!layer) {
    return false
  }
  deliver(layer)
  return true
}

// A backdrop press dismisses from the top down, through the first layer that
// shields those beneath, as the DOM's outside press does.
function outsidePress() {
  const dismissed: Layer[] = []
  for (const layer of active().reverse()) {
    dismissed.push(layer)
    if (layer.shield) {
      break
    }
  }
  for (const layer of dismissed) {
    layer.onBackdropPress?.()
  }
  return dismissed.length > 0
}

const input: NativeInput = {
  back: () => toTopmost((layer) => layer.onBack?.()),
  escape: (within) =>
    toTopmost((layer) => {
      if (layer.onEscapeGesture) {
        escapeAt = performance.now()
      }
      layer.onEscapeGesture?.(within)
    }),
  outsidePress,
}

function pushLayer(layer: Layer) {
  pushed++
  layer.order = pushed
  stack.push(layer)
  stopListening ??= nativeHost()?.listen(input)
  let popped = false
  return () => {
    if (popped) {
      return
    }
    popped = true
    const index = stack.indexOf(layer)
    if (index !== -1) {
      stack.splice(index, 1)
    }
    if (!stack.length) {
      stopListening?.()
      stopListening = undefined
    }
  }
}

true satisfies Twin<
  typeof Mirrored & { Layer: Mirrored.Layer },
  typeof Native & { Layer: Layer },
  "Layer" | "activeLayers" | "findLayer" | "layerContains" | "pushLayer"
>

export {
  activeLayers,
  bindPersistentLayer,
  findLayer,
  inPersistentLayer,
  lastClosed,
  lastEscape,
  type Layer,
  layerContains,
  layerCount,
  markClosed,
  openedSince,
  persistentLayers,
  pushLayer,
}
