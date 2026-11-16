// What `animateIn` and `animateOut` do on the DOM host, restated for the
// native host, where nothing reads an animation: the app ends an exit by
// calling `done`, or the exit ends at a fixed timeout.
import type { Part } from "../kernel/primitive-types"

const exitTimeout = 2000

/**
 * The first-frame and closing flags a part that animates in and out adds to
 * its state on the native host, where the DOM host writes
 * `data-starting-style` and `data-ending-style`.
 */
type PresenceState = {
  /** The part's first frame after it entered, so a style can start from it. */
  startingStyle: boolean
  /** The part is animating out, and takes no input. */
  endingStyle: boolean
}

type SettledListener = (shown: boolean) => void

const settledListeners = new WeakMap<Part, SettledListener>()

/**
 * Calls `listener` each time the part's presence settles: with `true` once it
 * entered, with `false` once its exit ended. A native behavior sets it while
 * the part's view is mounted, and it stays for the part's life: a part that
 * leaves without `onExit` settles after its view is gone.
 */
function onSettled(part: Part, listener: SettledListener) {
  settledListeners.set(part, listener)
}

/**
 * One part's presence on the native host. `enter` and `exit` follow whether
 * the part is shown; `onChange` runs whenever `get()` changes. An exit calls
 * `onExit` with `done`, and ends on the first `done` or after two seconds.
 * Without `onExit` it ends at once. Entering again cancels the exit. Entering
 * and the end of an exit settle `part()`, for its `onSettled` listener.
 */
function createPresence(onChange: () => void, part: () => Part) {
  let state: PresenceState & { exiting: boolean } = {
    startingStyle: false,
    endingStyle: false,
    exiting: false,
  }
  let frame: ReturnType<typeof requestAnimationFrame> | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: (() => void) | undefined

  const set = (next: Partial<typeof state>) => {
    state = { ...state, ...next }
    onChange()
  }
  const settle = (shown: boolean) => settledListeners.get(part())?.(shown)

  function stop() {
    if (frame !== undefined) {
      cancelAnimationFrame(frame)
      frame = undefined
    }
    clearTimeout(timer)
    pending = undefined
  }

  return {
    get: () => state,
    enter() {
      stop()
      frame = requestAnimationFrame(() => {
        frame = undefined
        set({ startingStyle: false })
      })
      set({ startingStyle: true, endingStyle: false, exiting: false })
      settle(true)
    },
    exit(onExit: ((done: () => void) => void) | undefined) {
      stop()
      if (!onExit) {
        set({ startingStyle: false, endingStyle: false, exiting: false })
        settle(false)
        return
      }
      const done = () => {
        if (pending !== done) {
          return
        }
        stop()
        set({ endingStyle: false, exiting: false })
        settle(false)
      }
      pending = done
      timer = setTimeout(done, exitTimeout)
      set({ startingStyle: false, endingStyle: true, exiting: true })
      onExit(done)
    },
    stop,
  }
}

export { createPresence, onSettled, type PresenceState }
