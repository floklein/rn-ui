"use client"

import { cn } from "cn"
import type * as PageTree from "fumadocs-core/page-tree"
import {
  AnchorProvider,
  useActiveAnchor,
  type TableOfContents,
} from "fumadocs-core/toc"
import Link from "next/link"
import * as React from "react"
import { BetaCard } from "./beta-card"
import { useCurrentUrl } from "./section-nav"

// A long sidebar opens at its top, so this brings the page's link into view when it's out of sight.
// It runs as an inline script too, so it uses nothing from outside its own body.
function revealCurrent(list: Element) {
  const link = list.querySelector('[aria-current="page"]')
  if (!link) {
    return
  }
  const box = list.getBoundingClientRect()
  const item = link.getBoundingClientRect()
  if (item.top >= box.top && item.bottom <= box.bottom) {
    return
  }
  list.scrollTop += item.top - box.top - (box.height - item.height) / 2
}

const noSubscribe = () => () => {}

// The router opens a plain click inside a transition, so its page can take a moment.
// The clicked link is marked at once instead, and React confirms it with the new page.
function markOpening(event: React.MouseEvent<HTMLAnchorElement>) {
  if (
    event.button !== 0 ||
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }
  const link = event.currentTarget
  link
    .closest("nav")
    ?.querySelector('[aria-current="page"]')
    ?.removeAttribute("aria-current")
  link.setAttribute("aria-current", "page")
}

function Sidebar({
  tree,
  tocs,
}: {
  tree: PageTree.Root
  tocs: Record<string, TableOfContents>
}) {
  const current = useCurrentUrl(tree)
  const scroller = React.useRef<HTMLDivElement>(null)
  // The script below only belongs in the server's HTML. A script React adds in the browser
  // never runs, so those renders leave it out and rely on the effect.
  const hydrated = React.useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false
  )

  React.useEffect(() => {
    const list = scroller.current
    if (!list) {
      return
    }
    // Measured once the page has painted, so the new page isn't laid out early.
    let timeout: ReturnType<typeof setTimeout>
    const frame = requestAnimationFrame(() => {
      timeout = setTimeout(() => revealCurrent(list))
    })
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timeout)
    }
  }, [current])

  return (
    <div className="flex min-h-0 flex-col">
      <div
        ref={scroller}
        className="min-h-0 flex-1 p-1 -m-1 overflow-x-hidden overflow-y-auto overscroll-y-contain pt-10 pe-4 pb-8 scrollbar-none"
      >
        <nav aria-label="Docs">
          <Nodes nodes={tree.children} tocs={tocs} current={current} />
        </nav>
        {/* Runs as the HTML arrives, so the list is already in place when the page first paints. */}
        {!hydrated && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(${revealCurrent})(document.currentScript.parentElement)`,
            }}
          />
        )}
        {/* The page's own column shows it from xl, beside the contents. */}
        <BetaCard className="mt-8 xl:hidden" />
      </div>
    </div>
  )
}

const groupLabel =
  "mb-2.5 font-mono text-[11px] tracking-[0.06em] text-muted-foreground uppercase"

function Nodes({
  nodes,
  tocs,
  current,
}: {
  nodes: PageTree.Node[]
  tocs: Record<string, TableOfContents>
  current?: string
}) {
  return (
    <ul className="flex flex-col">
      {nodes.map((node, index) => {
        if (node.type === "separator") {
          return (
            <li key={index} className={cn(groupLabel, "mt-8 first:mt-0")}>
              {node.name}
            </li>
          )
        }
        if (node.type === "folder") {
          return (
            <li key={index}>
              <Folder folder={node} tocs={tocs} current={current} />
            </li>
          )
        }
        return (
          <li key={node.url}>
            <PageLink
              page={node}
              toc={tocs[node.url]}
              active={node.url === current}
            />
          </li>
        )
      })}
    </ul>
  )
}

function Folder({
  folder,
  tocs,
  current,
}: {
  folder: PageTree.Folder
  tocs: Record<string, TableOfContents>
  current?: string
}) {
  return (
    <div className="mt-8">
      {folder.index ? (
        <Link
          href={folder.index.url}
          aria-current={folder.index.url === current ? "page" : undefined}
          className={cn(
            groupLabel,
            "block w-fit rounded-md underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
          )}
        >
          {folder.name}
        </Link>
      ) : (
        <div className={groupLabel}>{folder.name}</div>
      )}
      <Nodes nodes={folder.children} tocs={tocs} current={current} />
    </div>
  )
}

function PageLink({
  page,
  toc,
  active,
}: {
  page: PageTree.Item
  toc?: TableOfContents
  active: boolean
}) {
  const items = toc?.filter((item) => item.depth <= 2) ?? []

  return (
    <>
      <Link
        href={page.url}
        onClick={markOpening}
        aria-current={active ? "page" : undefined}
        className="block rounded-md py-1 text-sm text-subtle outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 aria-[current=page]:font-medium aria-[current=page]:text-foreground"
      >
        {page.name}
      </Link>
      {active && items.length > 1 && (
        <div className="xl:hidden">
          <AnchorProvider toc={items} single>
            <Toc items={items} />
          </AnchorProvider>
        </div>
      )}
    </>
  )
}

function Toc({ items }: { items: TableOfContents }) {
  const active = useActiveAnchor()
  if (items.length < 2) {
    return null
  }

  return (
    <ul className="mt-0.5 mb-2 ms-1 flex flex-col border-s border-foreground/10">
      {items.map((item) => {
        const current = active === item.url.slice(1)
        return (
          <li key={item.url}>
            <a
              href={item.url}
              aria-current={current ? "location" : undefined}
              className={cn(
                "relative -ms-px block border-s py-[3px] ps-3 text-[13px] leading-5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                current
                  ? "border-brand text-brand"
                  : "border-transparent text-subtle hover:text-foreground"
              )}
            >
              {item.title}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

export { Sidebar }
