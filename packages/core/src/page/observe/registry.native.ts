// The registry on the native host. Its parts have no element: what it reads
// of one comes from the host's `seen`, and a part is on screen while the host
// renders a view for it.
import type { AgentComponent } from "../agent/agent"
import type { ChangeSource } from "../../foundation/kernel/details"
import { nativeHost } from "../../foundation/kernel/native-host"
import type {
  Part,
  PrimitiveInstance,
} from "../../foundation/kernel/primitive-types"
import type { Twin } from "../../foundation/kernel/twin"
import { watchEarlier, watchers } from "../../foundation/kernel/watchers"
import type * as Mirrored from "./registry"
import type { Bound, Entry, ObservedChange } from "./registry"
import type * as Native from "./registry.native"

const entries = new Map<string, Entry>()
const byId = new Map<string, Entry>()
const retired = new Map<string, { at: number; refs: string[] }>()
const retiredLimit = 500
const offPage = new Map<string, AgentComponent>()
const partsOf = new WeakMap<PrimitiveInstance, ReadonlyMap<string, Part>>()
let count = 0
type Listener = (change: ObservedChange, parts: Bound[]) => void
const listeners = new Map<Listener, boolean>()

function watch(
  instance: PrimitiveInstance,
  parts: ReadonlyMap<string, Part>,
  {
    controlled,
    commits,
    agent,
    options,
  }: Parameters<NonNullable<typeof watchers.add>>[2]
) {
  const entry: Entry = {
    ref: `c${++count}`,
    id: instance.id,
    component: instance.name,
    agent,
    options,
    controlled,
    commits,
    started: new Map(),
    instance: new WeakRef(instance),
    secret: agent?.secret,
  }
  entries.set(entry.ref, entry)
  byId.set(entry.id, entry)
  partsOf.set(instance, parts)
  return () => retire(entry)
}

function retire(entry: Entry) {
  if (entries.get(entry.ref) !== entry) {
    return
  }
  entries.delete(entry.ref)
  if (byId.get(entry.id) === entry) {
    byId.delete(entry.id)
  }
  if (!entry.key || entry.secret || entry.offLimits) {
    return
  }
  const queued = retired.get(entry.key)
  if (queued?.at === count) {
    queued.refs.push(entry.ref)
  } else {
    retired.delete(entry.key)
    retired.set(entry.key, { at: count, refs: [entry.ref] })
    if (retired.size > retiredLimit) {
      retired.delete(retired.keys().next().value!)
    }
  }
  const state = entry.instance.deref()?.get() as
    Record<string, unknown> | undefined
  const keys = stateKeys(entry, state ?? {}).filter((key) => key !== "open")
  if (!state || !keys.length) {
    return
  }
  const last: AgentComponent = {
    ref: entry.ref,
    component: entry.component,
    offPage: true,
    actions: [],
  }
  if (entry.label) {
    last.label = entry.label
  }
  for (const key of keys) {
    if (key === "value" || state[key] !== "") {
      last[key] = state[key] ?? null
    }
  }
  offPage.delete(entry.ref)
  offPage.set(entry.ref, last)
  if (offPage.size > 50) {
    offPage.delete(offPage.keys().next().value!)
  }
}

const stateKeys = (entry: Entry, state: Record<string, unknown>) =>
  entry.controlled ?? ["open", "value", "checked"].filter((key) => key in state)

const setterOf = (key: string) => `set${key[0].toUpperCase()}${key.slice(1)}`

const seenOf = (part: Part) => nativeHost()?.seen(part)

function remember(entry: Entry, parts: Bound[]) {
  const first = !entry.key
  const seen = parts.map(seenOf)
  entry.label = componentLabel(parts)
  entry.secret ||= seen.some((found) => found?.secret)
  entry.offLimits = seen.some((found) => found?.offLimits)
  entry.key = `${entry.component}|${entry.label}`
  if (!first) {
    return
  }
  const queue = retired.get(entry.key)?.refs
  const ref = queue?.shift()
  if (!ref) {
    return
  }
  if (!queue!.length) {
    retired.delete(entry.key)
  }
  offPage.delete(ref)
  entries.delete(entry.ref)
  entry.ref = ref
  entries.set(ref, entry)
}

function bound(instance: PrimitiveInstance) {
  return [...(partsOf.get(instance)?.values() ?? [])].filter(
    (part) => seenOf(part) !== undefined
  ) as Bound[]
}

const nameOf = (part: Part | undefined) => {
  const seen = part && seenOf(part)
  return seen?.label || seen?.text || undefined
}

function componentLabel(parts: Bound[]) {
  const keyless = (slot: string) =>
    parts.find((part) => part.slot === slot && !part.key)
  const first = (slot: string) => {
    const found = parts.filter((part) => part.slot === slot)
    return new Set(found.map((part) => part.key)).size === 1
      ? found[0]
      : found.find((part) => !part.key)
  }
  const label = seenOf(first("label")!)?.text?.slice(0, 80)
  if (label) {
    return label
  }
  const group = keyless("group") ?? keyless("root")
  const name = group && seenOf(group)?.label
  if (name) {
    return name
  }
  const field = seenOf(
    parts.find((part) => part.slot === "input" || part.slot === "control")!
  )?.label
  if (field) {
    return field
  }
  const root = keyless("root")
  const button = root && seenOf(root)?.role === "button" ? root : undefined
  const shown =
    nameOf(first("title")) ??
    nameOf(first("heading")) ??
    nameOf(first("trigger")) ??
    nameOf(button)
  if (shown) {
    return shown.slice(0, 80)
  }
  const keys = new Set(parts.map((part) => part.key).filter(Boolean))
  for (const part of parts) {
    const own = (!part.key || keys.size === 1) && seenOf(part)?.label
    if (own) {
      return own
    }
  }
}

// Rows are table and list markup, which native views don't have.
const rowOf = (_parts: Bound[]) => undefined as string | undefined

type Details = { reason: string; source: ChangeSource }

function report(
  id: string,
  key: string,
  value: unknown,
  details: Details,
  previous: unknown
) {
  const entry = byId.get(id)
  if (!listeners.size || !entry) {
    return
  }
  const { source } = details
  const held =
    !!entry.commits?.includes(key) &&
    source !== "programmatic" &&
    source !== "agent"
  if (entry.started.has(key) !== held) {
    entry.started.set(key, held ? previous : value)
  }
  send(entry, key, value, details, previous, held || undefined)
}

function settle(id: string, key: string, value: unknown, details: Details) {
  const entry = byId.get(id)
  if (!listeners.size || !entry?.started.has(key)) {
    return
  }
  send(entry, key, value, details, entry.started.get(key), false)
  entry.started.delete(key)
}

function send(
  entry: Entry,
  key: string,
  value: unknown,
  details: Details,
  previous: unknown,
  live?: boolean
) {
  const instance = entry.instance.deref()
  if (!instance) {
    return
  }
  const parts = bound(instance)
  if (parts.length) {
    remember(entry, parts)
  }
  const change: ObservedChange = {
    ref: entry.ref,
    component: entry.component,
    id: entry.id,
    key,
    value: entry.secret ? "[redacted]" : value,
    previous: entry.secret ? "[redacted]" : previous,
    reason: details.reason,
    source: details.source,
  }
  if (entry.label) {
    change.label = entry.label
  }
  listeners.forEach(
    (hearsSteps, listener) =>
      (live ?? hearsSteps) === hearsSteps && listener(change, parts)
  )
}

// An app renders on the device, never on a server, so it installs without a document.
function install() {
  if (watchers.add) {
    return
  }
  watchers.add = watch
  watchers.change = report
  watchers.commit = settle
  watchEarlier()
}

function listen(listener: Listener, live = false) {
  install()
  listeners.set(listener, live)
  return () => {
    listeners.delete(listener)
  }
}

// Native parts have no element to point at.
const elementsOf = (_ref: string) => [] as HTMLElement[]

true satisfies Twin<typeof Mirrored, typeof Native>

export {
  bound,
  type Bound,
  componentLabel,
  elementsOf,
  entries,
  type Entry,
  install,
  listen,
  type ObservedChange,
  offPage,
  remember,
  retire,
  rowOf,
  setterOf,
  stateKeys,
}
