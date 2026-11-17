import { warn } from "@ui-sdk/core/renderer"
import * as React from "react"
import {
  type GestureResponderEvent,
  type HostInstance,
  StyleSheet,
  View,
} from "react-native"
import { layerInput } from "./native-host"

type Insets = { top: number; right: number; bottom: number; left: number }

/**
 * Props for `OverlayHost`.
 * @experimental
 */
type OverlayHostProps = {
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
  insets: () => Insets
  view: { current: HostInstance | null }
  entries: () => ReadonlyMap<string, React.ReactNode>
  set: (key: string, element: React.ReactNode) => void
  remove: (key: string) => void
  subscribe: (listener: () => void) => () => void
}

function createHost(inModal: boolean, insets: () => Insets) {
  let entries: ReadonlyMap<string, React.ReactNode> = new Map()
  const listeners = new Set<() => void>()
  const update = (next: Map<string, React.ReactNode>) => {
    entries = next
    listeners.forEach((listener) => listener())
  }
  const host: Host = {
    inModal,
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

// The open hosts, in the order they mounted: the root host, then each open
// Modal's. A popup opened while a Modal is up renders in it, never as a
// sibling Modal, which iOS doesn't show over an open one.
let hosts: readonly Host[] = []
const hostListeners = new Set<() => void>()
const topmostHost = () => hosts.at(-1)

function subscribeHosts(listener: () => void) {
  hostListeners.add(listener)
  return () => {
    hostListeners.delete(listener)
  }
}

function openHost(host: Host) {
  hosts = [...hosts, host]
  hostListeners.forEach((listener) => listener())
  return () => {
    hosts = hosts.filter((open) => open !== host)
    hostListeners.forEach((listener) => listener())
  }
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
  if (hosts.length) {
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

// Not carried into a Modal, whose own host it names inside it.
const HostContext = React.createContext<Host | null>(null)

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

/**
 * Where non-modal popups render, above the app it wraps. Wrap the app in one,
 * near the root. Modal popups need none: each `Modal` carries its own host.
 * @experimental
 */
function OverlayHost({ children, insets }: OverlayHostProps) {
  const current = React.useRef(zero)
  React.useLayoutEffect(() => {
    current.current = { ...zero, ...insets }
  })
  const [host] = React.useState(() => createHost(false, () => current.current))
  return <HostView host={host}>{children}</HostView>
}

// The host a Modal carries, with the insets of the host around it.
function ModalHost({ children }: { children?: React.ReactNode }) {
  const around = React.useContext(HostContext)
  const [host] = React.useState(() =>
    createHost(true, () => around?.insets() ?? zero)
  )
  return <HostView host={host}>{children}</HostView>
}

/**
 * Renders a non-modal popup's layer in the topmost open host from the moment
 * it shows until it hides, or in place with a warning when there is none. A
 * modal popup's `Modal` renders in place, keeping the providers above it,
 * unless a `Modal` it isn't inside is up.
 */
function useHosted(
  element: React.ReactNode,
  shown: boolean,
  popup: { component: string; id: string; modal: boolean }
) {
  const key = React.useId()
  const nearest = React.useContext(HostContext)
  const topmost = React.useSyncExternalStore(subscribeHosts, topmostHost)
  const target =
    !popup.modal || (topmost?.inModal && topmost !== nearest)
      ? topmost
      : undefined
  const [chosen, setChosen] = React.useState<{ host?: Host }>()
  // A non-modal one open on the first render, before the host around it has
  // mounted, takes it once it has.
  const wanted = shown
    ? chosen && (chosen.host || !target || popup.modal)
      ? chosen
      : { host: target }
    : undefined
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

const useHost = () => React.useContext(HostContext)

const styles = StyleSheet.create({ host: { flex: 1 } })

export {
  type Host,
  landIn,
  ModalHost,
  onTouch,
  OverlayHost,
  type OverlayHostProps,
  useHost,
  useHosted,
}
