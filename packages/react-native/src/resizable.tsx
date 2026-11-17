import { nativeResizable, resizableNative } from "@ui-sdk/core/native"
import {
  resizable,
  type ResizableOptions,
  type ResizablePanelState,
  type ResizablePrimitive,
  type ResizableState,
} from "@ui-sdk/core/resizable"
import * as React from "react"
import { View } from "react-native"
import { carry } from "./carried-context"
import { mergeProps } from "./render-element"
import {
  createParts,
  type PartProps,
  type Parts,
  useHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

type ResizableParts = Parts<
  ResizablePrimitive,
  { panel: typeof View; handle: typeof View }
>

const parts: ResizableParts = createParts(
  resizable,
  { panel: View, handle: View },
  resizableNative
)

// The points the panels share, as the group last measured them.
const SpaceContext = carry("ResizableSpace", React.createContext(0))

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
  const [space, setSpace] = React.useState(0)
  return (
    <SpaceContext.Provider value={space}>
      {usePart(
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
            onLayout: () => setSpace(nativeResizable(handle.api).measure()),
          },
          props
        ),
        View
      )}
    </SpaceContext.Provider>
  )
}

/**
 * A panel. Its size is a share of the group's flex space, so it renders on
 * every frame of a drag; keep what's inside it cheap to render, or memoized.
 * @experimental
 */
function ResizablePanel(props: React.ComponentProps<ResizableParts["Panel"]>) {
  const group = useHandle(resizable)
  const space = React.useContext(SpaceContext)
  // Until the group has measured its panels, they grow by their shares,
  // which fills the group whatever their padding. After, each takes its
  // share of the measured points, as a flex share would short their padding.
  const style = (state: ResizablePanelState) => {
    const laidOut = group.state.layout.length > 0
    return {
      flexGrow: space && laidOut ? 0 : laidOut ? state.size : 1,
      flexShrink: 1,
      flexBasis: space && laidOut ? (state.size / 100) * space : 0,
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
