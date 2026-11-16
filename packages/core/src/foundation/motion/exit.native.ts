import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./exit"
import type * as Native from "./exit.native"
import { awaitExit, exitHeld } from "./presence-native"

// A popup's content that animates out holds its mount, through its native
// behavior, until the adapter's presence ends the exit.
const holdsMount = exitHeld

const afterExit = awaitExit

true satisfies Twin<typeof Mirrored, typeof Native>

export { afterExit, holdsMount }
