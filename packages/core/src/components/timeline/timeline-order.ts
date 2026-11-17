/**
 * Writes how many events the timeline holds and each event's place from 0,
 * as `--timeline-count` and `--timeline-index`. Returns whether the events
 * get positions in state: only a feed's do, since a list's places come from
 * its markup.
 */
function orderEvents(
  root: HTMLElement | undefined,
  items: readonly { el: HTMLElement }[],
  feed: boolean
) {
  root?.style.setProperty("--timeline-count", String(items.length))
  items.forEach((item, index) =>
    item.el.style.setProperty("--timeline-index", String(index))
  )
  return feed
}

export { orderEvents }
