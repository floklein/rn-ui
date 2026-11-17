import { warn } from "@ui-sdk/core/renderer"
import * as React from "react"
import {
  type GestureResponderEvent,
  type HostInstance,
  StyleSheet,
  View,
} from "react-native"
import { layerInput } from "./native-host"
import {
  HostContext,
  hostCount,
  openHost,
  subscribeHosts,
  topmostHost,
  useHost,
} from "./open-hosts"

type Insets = { top: number; right: number; bottom: number; left: number }

type RootHostProps = {
  /** The app. */
  children?: React.ReactNode
  /**
   * The safe-area insets popups keep clear of. Pass `useSafeAreaInsets()`
   * from `react-native-safe-area-context`.
   * @defaultValue 0 on every side
   */
  insets?: Partial<Insets>
}

type Host = {
  inModal: boolean
  // A root host inside another, like in the app's own Modal: a modal popup
  // opened under it renders in it, as in a ModalHost.
  nested: boolean
  insets: () => Insets
  view: { current: HostInstance | null }
  entries: () => ReadonlyMap<string, React.ReactNode>
  set: (key: string, element: React.ReactNode) => void
  remove: (key: string) => void
  subscribe: (listener: () => void) => () => void
}

function createHost(inModal: boolean, nested: boolean, insets: () => Insets) {
  let entries: ReadonlyMap<string, React.ReactNode> = new Map()
  const listeners = new Set<() => void>()
  const update = (next: Map<string, React.ReactNode>) => {
    entries = next
    listeners.forEach((listener) => listener())
  }
  const host: Host = {
    inModal,
    nested,
    insets,
    view: { current: null },
    entries: () => entries,
    set(key, element) {
      if (entries.get(key) !== element) {
        update(new Map(entries).set(key, element))
      }
    },
    remove(key) {
      if (entries.has(key)) {
        const next = new Map(entries)
        next.delete(key)
        update(next)
      }
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
  return host
}

// A press is observed by the hosts it bubbles through, and let through. The
// parts it lands in on the way name their popup, so it dismisses only the
// layers above the first it landed in. The innermost host takes it.
const slop = 10
const landed = new Set<object>()
let started:
  { event: object; within: object[]; x: number; y: number } | undefined

// A finger on the screen can scroll what a popup is placed against.
const touchListeners = new Set<() => void>()

function onTouch(listener: () => void) {
  touchListeners.add(listener)
  return () => {
    touchListeners.delete(listener)
  }
}

const touched = () => touchListeners.forEach((listener) => listener())

const landIn = (api: object) => () => {
  if (hostCount()) {
    landed.add(api)
  }
}

function touchStart({ nativeEvent }: GestureResponderEvent) {
  if (started?.event === nativeEvent) {
    return
  }
  started = {
    event: nativeEvent,
    within: [...landed],
    x: nativeEvent.pageX,
    y: nativeEvent.pageY,
  }
  landed.clear()
  touched()
}

function touchCancel() {
  started = undefined
}

function touchEnd({ nativeEvent }: GestureResponderEvent) {
  const press = started
  started = undefined
  if (
    press &&
    Math.hypot(nativeEvent.pageX - press.x, nativeEvent.pageY - press.y) < slop
  ) {
    layerInput()?.press(press.within)
  }
}

function HostView({
  host,
  children,
}: {
  host: Host
  children?: React.ReactNode
}) {
  const entries = React.useSyncExternalStore(host.subscribe, host.entries)
  React.useLayoutEffect(() => openHost(host), [host])
  return (
    <HostContext.Provider value={host}>
      <View
        ref={host.view}
        style={styles.host}
        // A Modal hides the screen from VoiceOver. Here rather than on the
        // content, it doesn't hide the popups rendered beside the content.
        accessibilityViewIsModal={host.inModal}
        onTouchStart={touchStart}
        onTouchMove={touched}
        onTouchEnd={touchEnd}
        onTouchCancel={touchCancel}
      >
        {children}
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {[...entries].map(([key, element]) => (
            <React.Fragment key={key}>{element}</React.Fragment>
          ))}
        </View>
      </View>
    </HostContext.Provider>
  )
}

const zero: Insets = { top: 0, right: 0, bottom: 0, left: 0 }

function RootHost({ children, insets }: RootHostProps) {
  const current = React.useRef(zero)
  React.useLayoutEffect(() => {
    current.current = { ...zero, ...insets }
  })
  const around = React.useContext(HostContext)
  const [host] = React.useState(() =>
    createHost(false, !!around, () => current.current)
  )
  return <HostView host={host}>{children}</HostView>
}

// The host a Modal carries, with the insets of the host around it.
function ModalHost({ children }: { children?: React.ReactNode }) {
  const around = React.useContext(HostContext)
  const [host] = React.useState(() =>
    createHost(true, false, () => around?.insets() ?? zero)
  )
  return <HostView host={host}>{children}</HostView>
}

/**
 * Renders a non-modal popup's layer in the topmost open host from the moment
 * it shows until it hides, or in place with a warning when there is none. A
 * modal popup's `Modal` renders in place, keeping the providers above it,
 * unless a `Modal` it isn't inside is up. With `follow`, a non-modal layer
 * moves to each host that becomes topmost while it shows, as toasts do.
 */
function useHosted(
  element: React.ReactNode,
  shown: boolean,
  popup: { component: string; id: string; modal: boolean; follow?: boolean }
) {
  const key = React.useId()
  const nearest = React.useContext(HostContext)
  const topmost = React.useSyncExternalStore(subscribeHosts, topmostHost)
  const target =
    !popup.modal ||
    ((topmost?.inModal || topmost?.nested) && topmost !== nearest)
      ? topmost
      : undefined
  const [chosen, setChosen] = React.useState<{ host?: Host }>()
  // A non-modal one open on the first render, before the host around it has
  // mounted, takes it once it has.
  const keep =
    chosen &&
    (popup.follow
      ? chosen.host === target
      : chosen.host || !target || popup.modal)
  const wanted = shown ? (keep ? chosen : { host: target }) : undefined
  if (wanted !== chosen) {
    setChosen(wanted)
  }
  const host = wanted?.host
  React.useLayoutEffect(() => {
    host?.set(key, element)
  })
  React.useLayoutEffect(() => () => host?.remove(key), [host, key])
  const missing = shown && !host && !popup.modal
  React.useEffect(() => {
    if (missing && !topmostHost()) {
      warn(
        "a non-modal popup opened with no host to render it in. Wrap the app in <OverlayHost>.",
        popup
      )
    }
  }, [missing])
  return host ? null : element
}

const styles = StyleSheet.create({ host: { flex: 1 } })

export {
  type Host,
  landIn,
  ModalHost,
  onTouch,
  RootHost,
  type RootHostProps,
  useHost,
  useHosted,
}
