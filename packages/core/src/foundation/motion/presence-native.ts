// What `animateIn` and `animateOut` do on the DOM host, restated for the
// native host, where nothing reads an animation: the app ends an exit by
// calling `done`, or the exit ends at a fixed timeout.

const exitTimeout = 2000

/**
 * The first-frame and closing flags a part that animates in and out adds to
 * its state on the native host, where the DOM host writes
 * `data-starting-style` and `data-ending-style`.
 * @experimental
 */
type PresenceState = {
  /** The part's first frame after it entered, so a style can start from it. */
  startingStyle: boolean
  /** The part is animating out, and takes no input. */
  endingStyle: boolean
}

/**
 * One part's presence on the native host. `enter` and `exit` follow whether
 * the part is shown; `onChange` runs whenever `get()` changes. An exit calls
 * `onExit` with `done`, and ends on the first `done` or after two seconds.
 * Without `onExit` it ends at once. Entering again cancels the exit.
 */
function createPresence(onChange: () => void) {
  let state: PresenceState & { exiting: boolean } = {
    startingStyle: false,
    endingStyle: false,
    exiting: false,
  }
  let frame: ReturnType<typeof requestAnimationFrame> | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let settle: (() => void) | undefined

  const set = (next: Partial<typeof state>) => {
    state = { ...state, ...next }
    onChange()
  }

  function stop() {
    if (frame !== undefined) {
      cancelAnimationFrame(frame)
      frame = undefined
    }
    clearTimeout(timer)
    settle = undefined
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
    },
    exit(onExit: ((done: () => void) => void) | undefined) {
      stop()
      if (!onExit) {
        set({ startingStyle: false, endingStyle: false, exiting: false })
        return
      }
      const done = () => {
        if (settle !== done) {
          return
        }
        stop()
        set({ endingStyle: false, exiting: false })
      }
      settle = done
      timer = setTimeout(done, exitTimeout)
      set({ startingStyle: false, endingStyle: true, exiting: true })
      onExit(done)
    },
    stop,
  }
}

export { createPresence, type PresenceState }
