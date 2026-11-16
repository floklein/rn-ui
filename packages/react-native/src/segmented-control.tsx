import { segmentedControlNative } from "@ui-sdk/core/native"
import {
  segmentedControl,
  type SegmentedControlController,
  type SegmentedControlIndicatorState as SegmentedControlIndicatorCoreState,
  type SegmentedControlItemProps,
  type SegmentedControlItemState,
  type SegmentedControlOptions,
  type SegmentedControlPrimitive,
  type SegmentedControlState,
} from "@ui-sdk/core/segmented-control"
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
  usePart,
  usePrimitive,
} from "./use-primitive"

type SegmentedControlParts = Parts<
  SegmentedControlPrimitive,
  { indicator: typeof View }
>

const parts: SegmentedControlParts = createParts(segmentedControl, {
  indicator: View,
})

/**
 * The state the indicator hands `style`, `className`, `children` and
 * `render` functions: the control's value and orientation, and the checked
 * item's box in the control in pixels, the web's
 * `--segmented-control-indicator-*` variables. The box is unset until the
 * control and the item have been laid out, and while nothing is checked.
 * @experimental
 */
type SegmentedControlIndicatorState = SegmentedControlIndicatorCoreState & {
  /** The checked item's left edge, from the control's left edge. */
  indicatorLeft?: number
  /** The checked item's right edge, from the control's right edge. */
  indicatorRight?: number
  /** The checked item's top edge, from the control's top edge. */
  indicatorTop?: number
  /** The checked item's bottom edge, from the control's bottom edge. */
  indicatorBottom?: number
  /** The checked item's width. */
  indicatorWidth?: number
  /** The checked item's height. */
  indicatorHeight?: number
}

const LayoutsContext = React.createContext<Layouts | null>(null)

/**
 * A row of options where exactly one is on, like a radio group drawn as
 * buttons, in a `View` with the radio group role. Each item is its own
 * accessible element. It takes part in no form, so it has no `name`.
 * `T` is inferred from `value`, `defaultValue` or `onValueChange`.
 * @experimental
 */
function SegmentedControl<T extends string = string>({
  value,
  defaultValue,
  onValueChange,
  disabled,
  readOnly,
  required,
  loop,
  orientation,
  controller,
  debug,
  style,
  onLayout,
  ...props
}: Omit<SegmentedControlOptions<T>, "name" | "form"> &
  Omit<PartProps<typeof View, SegmentedControlState>, "onChange">) {
  const [layouts] = React.useState(createLayouts)
  const control = usePrimitive(
    segmentedControl,
    {
      value,
      defaultValue,
      onValueChange: onValueChange as SegmentedControlOptions["onValueChange"],
      disabled,
      readOnly,
      required,
      loop,
      orientation,
      controller: controller as SegmentedControlController | undefined,
      debug,
    },
    segmentedControlNative
  )
  return (
    <LayoutsContext value={layouts}>
      {usePart(
        control,
        "root",
        {},
        {
          ...props,
          style: measuredStyle(layouts, style),
          onLayout: (event: LayoutChangeEvent) => {
            layouts.container(event.nativeEvent.layout)
            onLayout?.(event)
          },
        } as Record<string, unknown>,
        View
      )}
    </LayoutsContext>
  )
}

/**
 * One option: a `Pressable` with the radio role. It has no hidden input.
 * @experimental
 */
function SegmentedControlItem({
  value,
  disabled,
  onLayout,
  ...props
}: SegmentedControlItemProps &
  PartProps<typeof Pressable, SegmentedControlItemState>) {
  const layout = useItemLayout(
    React.useContext(LayoutsContext),
    value,
    onLayout
  )
  return usePart(
    segmentedControl,
    "item",
    { value, disabled },
    { ...props, onLayout: layout } as Record<string, unknown>,
    Pressable
  )
}

/**
 * Sits behind the checked item. Render it inside the control: its state holds
 * the checked item's box, measured from the layouts of the control and the
 * items placed in it.
 * @experimental
 */
function SegmentedControlIndicator(
  props: PartProps<typeof View, SegmentedControlIndicatorState>
) {
  const handle = useHandle(segmentedControl)
  const value = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => handle.state.value
  )
  const box = useActiveBox(React.useContext(LayoutsContext), value)
  const indicator = box && {
    indicatorLeft: box.left,
    indicatorRight: box.right,
    indicatorTop: box.top,
    indicatorBottom: box.bottom,
    indicatorWidth: box.width,
    indicatorHeight: box.height,
  }
  return (
    <parts.Indicator
      {...props}
      {...withState<
        SegmentedControlIndicatorCoreState,
        Partial<SegmentedControlIndicatorState>
      >(props, () => ({ ...indicator }))}
    />
  )
}

export { createSegmentedControlController } from "@ui-sdk/core/segmented-control"
export type {
  SegmentedControlApi,
  SegmentedControlChangeOptions,
  SegmentedControlController,
  SegmentedControlItemProps,
  SegmentedControlItemState,
  SegmentedControlOptions,
  SegmentedControlOrientation,
  SegmentedControlPrimitive,
  SegmentedControlState,
  SegmentedControlValueChangeReason,
} from "@ui-sdk/core/segmented-control"

export {
  SegmentedControl,
  SegmentedControlIndicator,
  type SegmentedControlIndicatorState,
  SegmentedControlItem,
}
