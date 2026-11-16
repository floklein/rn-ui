import type { PresenceState } from "@ui-sdk/core/renderer"
import * as React from "react"
import { type LayoutChangeEvent, View } from "react-native"
import { type Interaction, withState } from "./render-element"

/**
 * The size a disclosure panel adds to its state, the web's
 * `--collapsible-panel-*` and `--accordion-panel-*` variables: its
 * content's while open, measured apart from the panel's own height; the size
 * the panel had when it began closing while it animates out, smaller than
 * its content's when an opening was interrupted; and 0 once closed. Unset
 * until the content has been laid out.
 */
type PanelSizeState = {
  /** The panel's height, in pixels. */
  panelHeight?: number
  /** The panel's width, in pixels. */
  panelWidth?: number
}

type Size = { width: number; height: number }

const closed: Size = { width: 0, height: 0 }

const sizeOf = ({ width, height }: Size) => ({ width, height })

function createPanelSize() {
  const listeners = new Set<() => void>()
  let content: Size | undefined
  let own: Size | undefined
  let atClose: Size | undefined
  let version = 0
  const changed = () => {
    version++
    listeners.forEach((listener) => listener())
  }
  return {
    content(size: Size) {
      content = size
      changed()
    },
    own(size: Size) {
      own = size
    },
    close() {
      atClose = own ?? content
      changed()
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    version: () => version,
    state({ open, endingStyle }: { open: boolean } & PresenceState) {
      const size = open ? content : endingStyle ? atClose : closed
      return {
        panelHeight: size?.height,
        panelWidth: size?.width,
      } satisfies PanelSizeState
    },
  }
}

// The children render in a view of their own, so the measured size is the
// content's whatever height the panel's style gives it.
function usePanelSize<State extends { open: boolean } & PresenceState>(
  { children, onLayout, ...props }: Record<string, any>,
  isOpen: () => boolean,
  subscribe: (listener: () => void) => () => void
) {
  const [size] = React.useState(createPanelSize)
  React.useSyncExternalStore(size.subscribe, size.version)
  React.useEffect(() => {
    let open = isOpen()
    return subscribe(() => {
      if (open && !isOpen()) {
        size.close()
      }
      open = isOpen()
    })
  }, [size, isOpen, subscribe])
  const content = (state: State, interaction: Interaction) => (
    <View
      onLayout={(event: LayoutChangeEvent) =>
        size.content(sizeOf(event.nativeEvent.layout))
      }
    >
      {typeof children === "function" ? children(state, interaction) : children}
    </View>
  )
  return {
    ...props,
    ...withState<State, PanelSizeState>(
      { ...props, children: content },
      size.state
    ),
    onLayout: (event: LayoutChangeEvent) => {
      size.own(sizeOf(event.nativeEvent.layout))
      onLayout?.(event)
    },
  }
}

export { type PanelSizeState, usePanelSize }
