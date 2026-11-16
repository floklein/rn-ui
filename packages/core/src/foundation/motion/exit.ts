/**
 * Whether a popup with no element of its own stays mounted as it closes.
 * Never on the DOM host, where the element's animations hold it instead.
 */
function holdsMount(_owner: object) {
  return false
}

/**
 * Hands the unmount of a closing popup with no element to the host's
 * presence: `done` runs at once on the DOM host. Returns what cancels it, for
 * a popup that reopens first, or nothing when it already ran.
 */
// check-code: allow return-type its native twin returns a cancel, which this one never has.
function afterExit(_owner: object, done: () => void): (() => void) | undefined {
  done()
  return undefined
}

export { afterExit, holdsMount }
