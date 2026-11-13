// PROTOTYPE (issue #14). The native twin of `layers.ts`: the same layer stack
// with no document. What dismisses a layer comes from the native host and
// goes to the topmost one.
import { nativeHost } from "../kernel/native-host"
import type { Layer as DomLayer } from "./layers"

// The DOM's `Layer` has no hook for Android's back, which the web hears
// through a CloseWatcher inside `popups/popup.ts`.
type Layer = DomLayer & { onBack?: () => void }

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
  return persistent
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

// A layer that refuses the dismissal still takes it, so Android's back never
// falls through to navigation while a layer is open.
function toTopmost(deliver: (layer: Layer) => void) {
  const layer = active().at(-1)
  if (!layer) {
    return false
  }
  deliver(layer)
  return true
}

const input = {
  back: () => toTopmost((layer) => layer.onBack?.()),
  escape: () =>
    toTopmost((layer) => {
      escapeAt = Date.now()
      // The DOM's hook takes the key event. The native gesture has none.
      layer.onEscape?.(undefined as unknown as KeyboardEvent)
    }),
  outsidePress: () =>
    toTopmost((layer) => layer.onOutsidePress?.(undefined as unknown as Event)),
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
