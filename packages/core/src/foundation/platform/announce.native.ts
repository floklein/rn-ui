import { nativeHost } from "../kernel/native-host"
import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./announce"
import type * as Native from "./announce.native"

type AnnouncePriority = "polite" | "assertive"

let announcer: ((text: string, priority: AnnouncePriority) => void) | undefined

function setAnnouncer(
  announce: ((text: string, priority: AnnouncePriority) => void) | undefined
) {
  announcer = announce
}

// The host's screen reader announcement needs no region made ahead of time.
function prepareAnnouncements(_doc: Document) {}

function announce(
  text: string,
  { priority = "polite" }: { priority?: AnnouncePriority; doc?: Document } = {}
) {
  if (!text) {
    return
  }
  if (announcer) {
    return announcer(text, priority)
  }
  nativeHost()?.announce(text, priority)
}

true satisfies Twin<typeof Mirrored, typeof Native>

export { announce, type AnnouncePriority, prepareAnnouncements, setAnnouncer }
