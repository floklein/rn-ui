import type { Twin } from "../../foundation/kernel/twin"
import type * as Mirrored from "./timeline-order"
import type * as Native from "./timeline-order.native"

// Native has no CSS variables and no markup to count, so every event's
// place is state, which the adapter hands its parts' styles.
const orderEvents = (
  root: HTMLElement | undefined,
  items: readonly { el: HTMLElement }[],
  feed: boolean
) => true

true satisfies Twin<typeof Mirrored, typeof Native>

export { orderEvents }
