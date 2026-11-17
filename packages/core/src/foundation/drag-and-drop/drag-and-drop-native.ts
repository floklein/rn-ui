import { nativeElement } from "../kernel/native-element"
import { nativeHost, type NativeTouch } from "../kernel/native-host"
import type { Part } from "../kernel/primitive-types"
import { isDrag } from "./pointer"
import type { Reorder } from "./reorder"
import type { Transfer } from "./transfer"

type TouchDrag = {
  move: (x: number, y: number) => void
  end: (canceled: boolean) => void
}

const transferItems = new WeakMap<Transfer, Set<Part>>()

// The responder's start, move and end make the calls the web's pointer
// handlers make: the item is picked up once the touch passes the drag
// threshold, and a responder cancelled, taken or unmounted puts it back.
function followTouches(
  part: Part,
  keyOf: (touch: NativeTouch | undefined) => string | undefined,
  pickUp: (key: string) => TouchDrag | undefined,
  capture = false
) {
  let pressed: { key: string; x: number; y: number } | undefined
  let drag: TouchDrag | undefined
  const end = (canceled: boolean) => {
    const current = drag
    pressed = drag = undefined
    current?.end(canceled)
  }
  const stop = nativeHost()?.follow(part, {
    accepts: (touch) => keyOf(touch) !== undefined,
    start(touch) {
      const key = keyOf(touch)
      pressed = key === undefined ? undefined : { key, x: touch.x, y: touch.y }
    },
    move({ x, y }) {
      if (!pressed) {
        return
      }
      if (!drag) {
        if (!isDrag(x - pressed.x, y - pressed.y)) {
          return
        }
        drag = pickUp(pressed.key)
        if (!drag) {
          pressed = undefined
          return
        }
      }
      drag.move(x, y)
    },
    end: () => end(false),
    cancel: () => end(true),
    capture,
  })
  return () => {
    stop?.()
    end(true)
  }
}

/**
 * Joins an item to a `createReorder` list on the native host and follows
 * the touch drags that start on it, as the item slot's `bind` and
 * `pointerdown` do on the DOM host. Return it from the item slot's native
 * behavior: `item: (part) => bindReorderItem(part.api.reorder, part)`.
 * @experimental
 */
function bindReorderItem(reorder: Reorder, part: Part) {
  const leave = reorder.bind(nativeElement(part), part)
  const stop = followTouches(part, () => part.key, reorder.drag)
  return () => {
    stop()
    leave()
  }
}

// The item whose box holds the touch: the list's view takes its items' touches.
function itemAt(transfer: Transfer, touch: NativeTouch | undefined) {
  for (const item of transferItems.get(transfer) ?? []) {
    const box = touch && nativeHost()?.box(item)
    if (
      box &&
      touch.x >= box.left &&
      touch.x <= box.left + box.width &&
      touch.y >= box.top &&
      touch.y <= box.top + box.height
    ) {
      return item.key
    }
  }
}

/**
 * Joins a list to a `createTransfer` on the native host and follows the
 * touch drags that start on its items. The list's view takes its items'
 * touches, since an item that moves to another list is rendered anew there
 * and the touch on its old view would end with no release. Return it from
 * the list slot's native behavior, and `bindTransferItem` from the item's.
 * @experimental
 */
function bindTransferList(transfer: Transfer, part: Part) {
  const leave = transfer.bindList(
    Object.assign(nativeElement(part), { isConnected: true }),
    part.key
  )
  const stop = followTouches(
    part,
    (touch) => itemAt(transfer, touch),
    transfer.drag,
    true
  )
  return () => {
    stop()
    leave()
  }
}

/**
 * Joins an item to a `createTransfer` on the native host, as the item
 * slot's `bind` does on the DOM host. Its list's `bindTransferList` follows
 * the touch drags that start on it.
 * @experimental
 */
function bindTransferItem(transfer: Transfer, part: Part) {
  const items = transferItems.get(transfer) ?? new Set()
  transferItems.set(transfer, items.add(part))
  const leave = transfer.bindItem(nativeElement(part), part.key)
  return () => {
    items.delete(part)
    leave()
  }
}

export { bindReorderItem, bindTransferList, bindTransferItem }
