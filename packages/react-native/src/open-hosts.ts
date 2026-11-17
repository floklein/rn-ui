import * as React from "react"
import type { Host } from "./overlay-host"

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

const hostCount = () => hosts.length

// Not carried into a Modal, whose own host it names inside it.
const HostContext = React.createContext<Host | null>(null)

const useHost = () => React.useContext(HostContext)

// Behind the topmost open Modal: in a host under it, or in none.
function isBehindModal(host: Host | null) {
  const index = host ? hosts.indexOf(host) : -1
  return hosts.slice(index + 1).some((open) => open.inModal)
}

export {
  HostContext,
  hostCount,
  isBehindModal,
  openHost,
  subscribeHosts,
  topmostHost,
  useHost,
}
