import { nativeElement } from "../../foundation/kernel/native-element"
import {
  type NativeBehavior,
  nativeHost,
} from "../../foundation/kernel/native-host"
import { createOrder, isAfter } from "../../foundation/kernel/order"
import { onProps } from "../../foundation/kernel/part"
import type {
  Part,
  PrimitiveContext,
} from "../../foundation/kernel/primitive-types"
import { isRTL } from "../../foundation/platform/env"
import type { ResizableHandleProps, ResizableOptions } from "./resizable"
import type { ResizableApi, State } from "./resizable-api"
import type { resizableDom } from "./resizable-dom"
import type { PanelSizes } from "./resizable-layout"

type Group = ReturnType<Parameters<typeof resizableDom>[1]>
type Entry = { key: string; el: HTMLElement; part: Part }

const sizeProps = [
  "defaultSize",
  "minSize",
  "maxSize",
  "collapsible",
  "collapsedSize",
] as const

// The `resizable-dom` twin: the host orders the panels and handles, measures
// the panels and follows the touches that drag a handle.
function createNativeResizableDom(
  context: PrimitiveContext<ResizableOptions, State, string>,
  group: () => Group
) {
  const { store } = context
  const panels = createOrder<Entry>()
  const handles = createOrder<Entry>()
  let space = 0

  function spaceOf() {
    const axis = group().vertical() ? "height" : "width"
    let total = 0
    for (const { part } of panels.list()) {
      total += nativeHost()?.box(part)?.[axis] ?? 0
    }
    return total
  }

  function measure() {
    space = spaceOf()
    group().setSpace(space)
    return space
  }

  function reconcile() {
    const list = panels.list()
    space = spaceOf()
    group().setPanels(
      list.map((panel) => panel.key),
      list.map((panel) => (panel.part.props ?? {}) as PanelSizes),
      space
    )
    const paired: Record<string, number> = {}
    let before = -1
    for (const { el, key } of handles.list()) {
      while (before + 1 < list.length && isAfter(list[before + 1].el, el)) {
        before++
      }
      paired[key] = before
    }
    group().setHandles(paired)
  }

  let scheduled = false
  function schedule() {
    if (scheduled) {
      return
    }
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      reconcile()
    })
  }

  function refresh() {
    if (!panels.size()) {
      return
    }
    const { ids } = store.get()
    group().setPanels(
      ids,
      ids.map((id) => context.props<PanelSizes>("panel", id) ?? {}),
      space
    )
  }

  const drags = new Set<string>()

  function follow(key: string, part: Part) {
    let origin = 0
    const reach = (touch: { x: number; y: number }) => {
      const vertical = group().vertical()
      const moved = (vertical ? touch.y : touch.x) - origin
      return ((isRTL(null) && !vertical ? -moved : moved) / space) * 100
    }
    const unfollow = nativeHost()?.follow(part, {
      accepts: () =>
        !group().handleDisabled(key) && group().handleIndex(key) !== null,
      start(touch) {
        const handle = group().handleIndex(key)
        if (handle === null) {
          return
        }
        measure()
        if (!space || !group().startDrag(handle, key)) {
          return
        }
        origin = group().vertical() ? touch.y : touch.x
        drags.add(key)
      },
      move(touch) {
        if (drags.has(key)) {
          group().dragBy(reach(touch))
        }
      },
      end() {
        if (drags.delete(key)) {
          group().endDrag()
        }
      },
      // A drag a scroll view or the system takes leaves the layout it started from.
      cancel() {
        if (drags.delete(key)) {
          group().dragBy(0)
          group().endDrag()
        }
      },
    })
    return () => {
      unfollow?.()
      if (drags.delete(key) && store.get().dragging === key) {
        group().endDrag()
      }
    }
  }

  const bindings = {
    bindRoot(_el: HTMLElement) {
      schedule()
      return undefined as (() => void) | undefined
    },
    bindPanel(part: Part) {
      schedule()
      const leave = panels.add({ key: part.key, el: nativeElement(part), part })
      let sizes = part.props as PanelSizes
      const unwatch = onProps(part, () => {
        const next = part.props as PanelSizes
        if (sizeProps.every((name) => next[name] === sizes[name])) {
          return
        }
        sizes = next
        schedule()
      })
      return () => {
        unwatch()
        leave()
        schedule()
      }
    },
    bindHandle(el: HTMLElement, part: Part) {
      const key = part.key
      schedule()
      const leave = handles.add({ key, el, part })
      const unfollow = follow(key, part)
      let disabled = !!(part.props as ResizableHandleProps).disabled
      const unwatch = onProps(part, () => {
        const next = !!(part.props as ResizableHandleProps).disabled
        if (next === disabled) {
          return
        }
        disabled = next
        group().relock()
        if (disabled && drags.delete(key)) {
          group().endDrag()
        }
      })
      return () => {
        unwatch()
        unfollow()
        leave()
        schedule()
      }
    },
    measure,
  }
  const stopAll = () => drags.clear()

  return { refresh, bindings, stopAll }
}

/**
 * Resizable's behavior on the native host, as its binds do on the DOM host:
 * the parts join the group as they mount, a handle follows the touches that
 * drag it, and a screen reader's increment and decrement move it a step.
 * @experimental
 */
const resizableNative: NativeBehavior<ResizableApi> = {
  root: (part) => part.api.internal.bindRoot(nativeElement(part)),
  panel: (part) => part.api.internal.bindPanel(part),
  handle(part) {
    const unbind = part.api.internal.bindHandle(nativeElement(part), part)
    const unadjust = nativeHost()?.adjustable(part, (direction) =>
      part.api.internal.adjust(part.key, direction)
    )
    return () => {
      unbind()
      unadjust?.()
    }
  },
}

/**
 * What the adapter tells a resizable group on the native host, which reads
 * no layout itself: `measure()` once the group has laid out again, so panels
 * sized in pixels keep their size. It returns the points the panels share.
 * @experimental
 */
function nativeResizable(api: ResizableApi) {
  if (!("measure" in api.internal)) {
    throw new Error("nativeResizable takes a resizable group's api.")
  }
  return api.internal as unknown as { measure: () => number }
}

export { createNativeResizableDom, nativeResizable, resizableNative }
