// The watchers on the native host. An app renders only on the device, so the
// instances made before anything watched are kept for a watcher without the
// `document` the DOM module checks to tell a browser from a server.
import type { ChangeDetails, ChangeSource } from "./details"
import { whenKept } from "./keep"
import type {
  AgentSurface,
  Part,
  PrimitiveInstance,
  PropSpec,
} from "./primitive-types"
import type { Twin } from "./twin"
import type * as Mirrored from "./watchers"
import type * as Native from "./watchers.native"

type WatchedDefinition = {
  controlled?: string[]
  commits?: string[]
  agent?: AgentSurface
  options?: Record<string, PropSpec>
}

const watchers: {
  add?: (
    instance: PrimitiveInstance,
    parts: ReadonlyMap<string, Part>,
    definition: WatchedDefinition
  ) => () => void
  change?: (
    id: string,
    key: string,
    value: unknown,
    details: ChangeDetails,
    previous: unknown
  ) => void
  commit?: (
    id: string,
    key: string,
    value: unknown,
    details: { reason: string; source: ChangeSource }
  ) => void
} = {}

const earlier = new Set<WeakRef<PrimitiveInstance>>()
const watchLater = new WeakMap<PrimitiveInstance, () => void>()

function watchWhileKept(
  instance: PrimitiveInstance,
  parts: ReadonlyMap<string, Part>,
  definition: WatchedDefinition
) {
  let unwatch: (() => void) | undefined
  let waiting: WeakRef<PrimitiveInstance> | undefined
  const untrack = () => {
    unwatch?.()
    unwatch = undefined
    if (waiting) {
      earlier.delete(waiting)
    }
    waiting = undefined
  }
  whenKept(() => {
    if (watchers.add) {
      unwatch = watchers.add(instance, parts, definition)
    } else {
      earlier.add((waiting = new WeakRef(instance)))
      watchLater.set(
        instance,
        () => (unwatch = watchers.add?.(instance, parts, definition))
      )
      if (earlier.size % 1000 === 0) {
        for (const old of earlier) {
          if (!old.deref()) {
            earlier.delete(old)
          }
        }
      }
    }
    return untrack
  })
}

function watchEarlier() {
  for (const ref of earlier) {
    earlier.delete(ref)
    const instance = ref.deref()
    if (instance) {
      watchLater.get(instance)?.()
    }
  }
}

true satisfies Twin<typeof Mirrored, typeof Native>

export { watchEarlier, watchers, watchWhileKept }
