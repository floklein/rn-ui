import * as React from "react"
import {
  I18nManager,
  type LayoutChangeEvent,
  type LayoutRectangle,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from "react-native"

const noBorders = { left: 0, right: 0, top: 0, bottom: 0 }

function createLayouts() {
  const items = new Map<string, LayoutRectangle>()
  const listeners = new Set<() => void>()
  let container: LayoutRectangle | undefined
  let borders = noBorders
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
    // Absolute insets start inside the container's border, and layouts
    // include it. A border that changes moves the items, which report again.
    style(style: StyleProp<ViewStyle>) {
      const flat = StyleSheet.flatten(style) ?? {}
      const all = flat.borderWidth ?? 0
      const rtl = I18nManager.isRTL
      const swap = rtl && I18nManager.doLeftAndRightSwapInRTL
      const start = flat.borderStartWidth
      const end = flat.borderEndWidth
      const left = swap ? flat.borderRightWidth : flat.borderLeftWidth
      const right = swap ? flat.borderLeftWidth : flat.borderRightWidth
      borders = {
        left: (rtl ? end : start) ?? left ?? all,
        right: (rtl ? start : end) ?? right ?? all,
        top: flat.borderTopWidth ?? all,
        bottom: flat.borderBottomWidth ?? all,
      }
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
      const left = box.x - borders.left
      const right = container.width - box.x - box.width - borders.right
      // React Native reads `left` and `right` as start and end right to left.
      const swap = I18nManager.isRTL && I18nManager.doLeftAndRightSwapInRTL
      return {
        left: swap ? right : left,
        right: swap ? left : right,
        top: box.y - borders.top,
        bottom: container.height - box.y - box.height - borders.bottom,
        width: box.width,
        height: box.height,
      }
    },
  }
}

type Layouts = ReturnType<typeof createLayouts>

// A new value lays nothing out again, so the box carries over to it.
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

function measuredStyle<Args extends unknown[]>(
  layouts: Layouts,
  style:
    StyleProp<ViewStyle> | ((...args: Args) => StyleProp<ViewStyle>) | undefined
) {
  return (...args: Args) => {
    const resolved = typeof style === "function" ? style(...args) : style
    layouts.style(resolved)
    return resolved
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

export {
  createLayouts,
  type Layouts,
  measuredStyle,
  useActiveBox,
  useItemLayout,
}
