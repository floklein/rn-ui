import { MobileNav } from "@/components/mobile-nav"
import { Search } from "@/components/search"
import { Sidebar } from "@/components/sidebar"
import { StylingNotePopover } from "@/components/styling-note"
import { isFramework } from "@/lib/frameworks"
import type { Section } from "@/lib/sections"
import { frameworkTree, sectionPages, sectionTree } from "@/lib/section-tree"
import { getStarted, source } from "@/lib/source"
import type { Node, Root } from "fumadocs-core/page-tree"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

// Core's sidebar opens with an overview of the whole site: Get Started, Core's
// introduction, the tutorial and the changelog. Core's guides follow under its name.
const overview = [
  "/docs/core",
  "/docs/core/build-a-component",
  "/docs/core/changelog",
]

function withGetStarted(tree: Root): Root {
  const page = source.getPage(getStarted.slugs)
  if (!page) {
    return tree
  }
  const inOverview = (node: Node) =>
    node.type === "page" && overview.includes(node.url)
  const pages = overview.flatMap((url) =>
    tree.children.filter((node) => node.type === "page" && node.url === url)
  )
  return {
    ...tree,
    name: "",
    children: [
      { type: "separator", name: "Overview" },
      { type: "page", name: page.data.title, url: getStarted.url },
      ...pages,
      { type: "separator", name: tree.name },
      ...tree.children.filter((node) => !inOverview(node)),
    ],
  }
}

function DocsLayout({
  section,
  children,
}: {
  section: Section
  children: ReactNode
}) {
  const full = sectionTree(section)
  if (!full) {
    notFound()
  }
  const tree = isFramework(section)
    ? frameworkTree(full, section)
    : section === "core"
      ? withGetStarted(full)
      : full
  const tocs = Object.fromEntries([
    ...source
      .getPages()
      .flatMap((page) =>
        page.slugs[0] === section ? [[page.url, page.data.toc]] : []
      ),
    ...(section === "core"
      ? [[getStarted.url, source.getPage(getStarted.slugs)?.data.toc]]
      : []),
  ])
  const pages = sectionPages(section === "core" ? withGetStarted(full) : full)
  const urls = source.getPages().map((page) => page.url)

  return (
    <div data-docs="" className="container flex flex-1 flex-col max-lg:px-0">
      <div className="flex flex-1">
        {/* Size containment keeps the sidebar from making a short page taller than the window. */}
        <aside className="relative hidden w-64 shrink-0 border-e border-foreground/[0.06] contain-size lg:block">
          <div className="sticky top-[4.375rem] flex max-h-[min(100%,calc(100dvh-4.375rem))] flex-col pt-2">
            <Sidebar tree={tree} tocs={tocs} />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <MobileNav section={section} tree={tree} urls={urls} />
          <main className="flex">{children}</main>
        </div>
      </div>
      <Search section={section} pages={pages} />
      <StylingNotePopover />
    </div>
  )
}

export { DocsLayout }
