import { nativeResizable, resizableNative } from "@ui-sdk/core/native"
import {
  resizable,
  type ResizableOptions,
  type ResizablePanelState,
  type ResizablePrimitive,
  type ResizableSize,
  type ResizableState,
} from "@ui-sdk/core/resizable"
import type { ComponentProps } from "react"
import { View } from "react-native"
import { mergeProps } from "./render-element"
import {
  createParts,
  type PartProps,
  type Parts,
  useHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

type ResizableParts = Parts<ResizablePrimitive, { panel: typeof View; handle: typeof View }>

const parts: ResizableParts = createParts(
  resizable,
  { panel: View, handle: View },
  resizableNative
)

const remSize = 16

function basisOf(size: ResizableSize) {
  if (typeof size === "number") {
    return `${size}%` as const
  }
  if (size.endsWith("%")) {
    return size as `${number}%`
  }
  return parseFloat(size) * (size.endsWith("rem") ? remSize : 1)
}

/**
 * The group: a `View` that lays its panels out along its orientation. It
 * saves its layout with `autoSaveId` only into a `storage` the app passes,
 * since native has no `localStorage`.
 * @experimental
 */
function Resizable({
  layout,
  defaultLayout,
  onLayoutChange,
  onLayoutCommit,
  orientation,
  disabled,
  step,
  largeStep,
  autoSaveId,
  storage,
  controller,
  debug,
  ...props
}: ResizableOptions & PartProps<typeof View, ResizableState>) {
  const handle = usePrimitive(
    resizable,
    {
      layout,
      defaultLayout,
      onLayoutChange,
      onLayoutCommit,
      orientation,
      disabled,
      step,
      largeStep,
      autoSaveId,
      storage,
      controller,
      debug,
    },
    resizableNative
  )
  return usePart(
    handle,
    "root",
    {},
    mergeProps(
      {
        style: (state: ResizableState) => ({
          flexDirection:
            state.orientation === "vertical"
              ? ("column" as const)
              : ("row" as const),
        }),
        onLayout: () => nativeResizable(handle.api).measure(),
      },
      props
    ),
    View
  )
}

/**
 * A panel. Its size is a share of the group's flex space, so it renders on
 * every frame of a drag; keep what's inside it cheap to render, or memoized.
 * @experimental
 */
function ResizablePanel(
  props: ComponentProps<ResizableParts["Panel"]>
) {
  const group = useHandle(resizable)
  const { defaultSize } = props
  // Shares add up to 100%, so the handles' length comes off every panel in
  // proportion. Before the group lays out, a panel takes its default size,
  // and one without grows into what's left.
  const style = (state: ResizablePanelState) => {
    const laidOut = group.state.layout.length > 0
    return {
      flexGrow: laidOut || defaultSize !== undefined ? 0 : 1,
      flexShrink: 1,
      flexBasis: laidOut
        ? (`${state.size}%` as const)
        : defaultSize === undefined
          ? 0
          : basisOf(defaultSize),
      overflow: "hidden" as const,
    }
  }
  return <parts.Panel {...mergeProps({ style }, props)} />
}

/**
 * The handle between two panels: a `View` that follows a touch dragging it,
 * and that screen readers adjust as a slider, a step at a time. Give it an
 * `aria-label`, and widen a thin one's touch area with `hitSlop`.
 * @experimental
 */
const ResizableHandle: ResizableParts["Handle"] = parts.Handle

export {
  createResizableController,
  resizableStorageKey,
} from "@ui-sdk/core/resizable"
export type {
  ResizableApi,
  ResizableChangeOptions,
  ResizableController,
  ResizableHandleProps,
  ResizableHandleState,
  ResizableLayoutChangeDetails,
  ResizableLayoutChangeReason,
  ResizableLayoutCommitDetails,
  ResizableOptions,
  ResizablePanelProps,
  ResizablePanelState,
  ResizablePrimitive,
  ResizableSize,
  ResizableState,
  ResizableStorage,
} from "@ui-sdk/core/resizable"

export { Resizable, ResizableHandle, ResizablePanel }
