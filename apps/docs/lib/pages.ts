import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { repoRoot } from "./repo-root"
import { sharedSections } from "./sections"
import type { Framework } from "./frameworks"

// The docs pages, read from their files, for code that runs outside the site,
// like the Markdown copies the packages ship.

const contentDir = path.join(repoRoot, "apps/docs/content/docs")

type DocPage = {
  /** Where the page sits, like `["react", "components", "popover"]`. A folder's index has the folder's. */
  slugs: string[]
  file: string
  title: string
  description?: string
  date?: string
}

// An included file can include others, like the setup prompt each framework's tab includes.
// check-code: allow return-type recursive, so TypeScript cannot infer it.
function withIncludes(text: string, dir: string): string {
  return text.replace(/<include>(.+?)<\/include>/g, (_, included: string) => {
    const file = path.resolve(dir, included)
    return withIncludes(
      readFileSync(file, "utf8").trimEnd(),
      path.dirname(file)
    )
  })
}

/** A page's frontmatter and the content after it, with each `<include>` replaced by the file it names. */
function readPage(file: string) {
  const [, frontmatter, source] = readFileSync(file, "utf8").match(
    /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  )!
  const body = withIncludes(source, path.dirname(file))
  return {
    title: frontmatter.match(/^title: (.*)$/m)![1],
    description: frontmatter.match(/^description: (.*)$/m)?.[1],
    date: frontmatter.match(/^date: "(.*)"$/m)?.[1],
    body,
  }
}

/** The page at `slugs`, or undefined when there's none. */
function docPage(slugs: string[]) {
  const base = path.join(contentDir, ...slugs)
  const file = [`${base}.mdx`, path.join(base, "index.mdx")].find((candidate) =>
    existsSync(candidate)
  )
  if (!file) {
    return undefined
  }
  const { title, description, date } = readPage(file)
  return { slugs, file, title, description, date } satisfies DocPage
}

/**
 * A page's link that names no framework, the way Core and Agents link to a
 * framework's pages: `/docs/components/menu` for any framework's Menu, which
 * goes to the framework the reader last read. Core and Agents pages keep
 * their own.
 */
function sharedHref(slugs: string[]) {
  const [section, folder, ...rest] = slugs
  if (section in sharedSections) {
    return `/docs/${slugs.join("/")}`
  }
  return `/docs/${[folder === "hooks" ? "utilities" : folder, ...rest].filter(Boolean).join("/")}`
}

/**
 * A folder's pages, like `react/components`, in the sidebar's order: its index, then the pages its
 * meta.json lists, then the rest by title, the way the component grid sorts.
 */
function docPages(folder: string) {
  const dir = path.join(contentDir, folder)
  if (!existsSync(dir)) {
    return []
  }
  const meta = path.join(dir, "meta.json")
  const listed = existsSync(meta)
    ? (JSON.parse(readFileSync(meta, "utf8")) as { pages: string[] }).pages
    : []
  const rest = readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.slice(0, -".mdx".length))
    .filter((name) => name !== "index" && !listed.includes(name))
  const slugs = folder.split("/")
  // A listed folder with no index of its own stands for its pages.
  // check-code: allow return-type recursive, so TypeScript cannot infer it.
  const pages = (names: string[]): DocPage[] =>
    names.flatMap(
      (name) =>
        docPage([...slugs, name]) ??
        (existsSync(path.join(dir, name, "meta.json"))
          ? docPages(`${folder}/${name}`)
          : [])
    )
  return [
    ...pages(["index"]).map((page) => ({ ...page, slugs })),
    ...pages(listed.filter((name) => name !== "index")),
    ...pages(rest).sort((a, b) => a.title.localeCompare(b.title)),
  ]
}

// Top-level framework guides, in the same order as the sidebar.
function frameworkGuides(framework: Framework) {
  return docPages(framework).filter(
    (page) =>
      page.slugs.length <= 2 &&
      !["components", "hooks", "utilities"].includes(page.slugs[1])
  )
}

export {
  contentDir,
  docPage,
  type DocPage,
  docPages,
  frameworkGuides,
  readPage,
  sharedHref,
  withIncludes,
}
