import { tabsNative } from "@ui-sdk/core/native"
import {
  tabs,
  type TabsIndicatorState as TabsIndicatorCoreState,
  type TabsPrimitive,
} from "@ui-sdk/core/tabs"
import * as React from "react"
import { type LayoutChangeEvent, Pressable, View } from "react-native"
import {
  createLayouts,
  type Layouts,
  measuredStyle,
  useActiveBox,
  useItemLayout,
} from "./indicator-layouts"
import { withState } from "./render-element"
import {
  createParts,
  type PartProps,
  type Parts,
  useHandle,
} from "./use-primitive"

type TabsParts = Parts<
  TabsPrimitive,
  {
    root: typeof View
    list: typeof View
    tab: typeof Pressable
    "tab-icon": typeof View
    indicator: typeof View
    panel: typeof View
  }
>

const parts: TabsParts = createParts(
  tabs,
  {
    root: View,
    list: View,
    tab: Pressable,
    "tab-icon": View,
    indicator: View,
    panel: View,
  },
  tabsNative
)

/**
 * The state the indicator hands `style`, `className`, `children` and
 * `render` functions: the tabs' orientation and direction, and the selected
 * tab's box in the list in pixels, the web's `--active-tab-*` variables.
 * The box is unset until the list and the tab have been laid out.
 * @experimental
 */
type TabsIndicatorState = TabsIndicatorCoreState & {
  /** The selected tab's left edge, from the list's left edge. */
  activeTabLeft?: number
  /** The selected tab's right edge, from the list's right edge. */
  activeTabRight?: number
  /** The selected tab's top edge, from the list's top edge. */
  activeTabTop?: number
  /** The selected tab's bottom edge, from the list's bottom edge. */
  activeTabBottom?: number
  /** The selected tab's width. */
  activeTabWidth?: number
  /** The selected tab's height. */
  activeTabHeight?: number
}

const LayoutsContext = React.createContext<Layouts | null>(null)

/**
 * Layered sections of content, one shown at a time, in a `View`.
 * `T` is inferred from `value`, `defaultValue` or `onValueChange`.
 * @experimental
 */
const Tabs: TabsParts["Root"] = parts.Root

/**
 * The row of tabs, a `View` with the tab list role. Each tab is its own
 * accessible element, reached by swiping.
 * @experimental
 */
const TabsList = function TabsList({
  style,
  onLayout,
  ...props
}: React.ComponentProps<TabsParts["List"]>) {
  const [layouts] = React.useState(createLayouts)
  return (
    <LayoutsContext value={layouts}>
      <parts.List
        {...props}
        style={measuredStyle(layouts, style)}
        onLayout={(event: LayoutChangeEvent) => {
          layouts.container(event.nativeEvent.layout)
          onLayout?.(event)
        }}
      />
    </LayoutsContext>
  )
} as TabsParts["List"]

/**
 * A tab: a `Pressable` with the tab role. Pressing it shows the panel with
 * the same `value`.
 * @experimental
 */
const TabsTab = function TabsTab({
  onLayout,
  ...props
}: React.ComponentProps<TabsParts["Tab"]>) {
  const layout = useItemLayout(
    React.useContext(LayoutsContext),
    props.value,
    onLayout
  )
  return <parts.Tab {...props} onLayout={layout} />
} as TabsParts["Tab"]

/**
 * An icon inside a tab. A tab with only an icon needs an `aria-label`.
 * Screen readers skip it, and `mirror` flips it when the app runs right to left.
 * @experimental
 */
const TabsTabIcon: TabsParts["TabIcon"] = parts.TabIcon

/**
 * Marks the selected tab. Render it inside the list: its state holds the
 * selected tab's box, measured from the layouts of the list and the tabs
 * placed in it.
 * @experimental
 */
function TabsIndicator(props: PartProps<typeof View, TabsIndicatorState>) {
  const handle = useHandle(tabs)
  const value = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => handle.state.value
  )
  const box = useActiveBox(React.useContext(LayoutsContext), value)
  const active = box && {
    activeTabLeft: box.left,
    activeTabRight: box.right,
    activeTabTop: box.top,
    activeTabBottom: box.bottom,
    activeTabWidth: box.width,
    activeTabHeight: box.height,
  }
  return (
    <parts.Indicator
      {...props}
      {...withState<TabsIndicatorCoreState, Partial<TabsIndicatorState>>(
        props,
        () => ({ ...active })
      )}
    />
  )
}

/**
 * The content of the tab with the same `value`, shown while that tab is
 * selected. Pass `onExit` to keep it mounted while it animates out.
 * @experimental
 */
const TabsPanel: TabsParts["Panel"] = parts.Panel

export { createTabsController } from "@ui-sdk/core/tabs"
export type {
  TabsApi,
  TabsChangeOptions,
  TabsController,
  TabsDirection,
  TabsListState,
  TabsOptions,
  TabsOrientation,
  TabsPanelProps,
  TabsPanelState,
  TabsPrimitive,
  TabsState,
  TabsTabIconProps,
  TabsTabIconState,
  TabsTabProps,
  TabsTabState,
  TabsValueChangeReason,
} from "@ui-sdk/core/tabs"

export {
  Tabs,
  TabsIndicator,
  type TabsIndicatorState,
  TabsList,
  TabsPanel,
  TabsTab,
  TabsTabIcon,
}
