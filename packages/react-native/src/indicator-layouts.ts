import * as React from "react"
import {
  I18nManager,
  type LayoutChangeEvent,
  type LayoutRectangle,
} from "react-native"

// The layouts of a container and its items, which an indicator over the
// active item reads.
function createLayouts() {
  const items = new Map<string, LayoutRectangle>()
  const listeners = new Set<() => void>()
  let container: LayoutRectangle | undefined
  let version = 0
  const changed = () => {
    version++
    listeners.forEach((listener) => listener())
  }
  return {
    container(box: LayoutRectangle) {
      container = box
      changed()
    },
    item(value: string, box: LayoutRectangle | undefined) {
      if (box) {
        items.set(value, box)
      } else {
        items.delete(value)
      }
      changed()
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    version: () => version,
    box(value: string | null) {
      const box = value === null ? undefined : items.get(value)
      if (!box || !container) {
        return undefined
      }
      const left = box.x
      const right = container.width - box.x - box.width
      // React Native reads `left` and `right` as start and end right to left.
      const swap = I18nManager.isRTL && I18nManager.doLeftAndRightSwapInRTL
      return {
        left: swap ? right : left,
        right: swap ? left : right,
        top: box.y,
        bottom: container.height - box.y - box.height,
        width: box.width,
        height: box.height,
      }
    },
  }
}

type Layouts = ReturnType<typeof createLayouts>

// Reports an item's layout under its value. A new value lays nothing out
// again, so the box carries over to it.
function useItemLayout(
  layouts: Layouts | null,
  value: string,
  onLayout: ((event: LayoutChangeEvent) => void) | undefined
) {
  const box = React.useRef<LayoutRectangle>(undefined)
  React.useEffect(() => {
    if (box.current) {
      layouts?.item(value, box.current)
    }
    return () => layouts?.item(value, undefined)
  }, [layouts, value])
  return (event: LayoutChangeEvent) => {
    box.current = event.nativeEvent.layout
    layouts?.item(value, box.current)
    onLayout?.(event)
  }
}

const noLayouts = () => () => {}
const unmeasured = () => 0

function useActiveBox(layouts: Layouts | null, value: string | null) {
  React.useSyncExternalStore(
    layouts?.subscribe ?? noLayouts,
    layouts?.version ?? unmeasured
  )
  return layouts?.box(value)
}

export { createLayouts, type Layouts, useActiveBox, useItemLayout }
