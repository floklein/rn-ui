import { expect, test } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { writePackageDocs } from "./package-docs"
import { pageMarkdown } from "./page-markdown"
import { docPage, docPages } from "./pages"
import { repoRoot } from "./repo-root"

// Pages with reference tables build a TypeScript program each, which takes seconds.
const link = ({ slugs }: { slugs: string[] }) => `/docs/${slugs.join("/")}`

test("every React Native page's Markdown names the fork's packages", async () => {
  const pages = docPages("react-native")
  expect(pages.length).toBeGreaterThan(2)
  for (const page of pages) {
    const markdown = await pageMarkdown(page.file, "react-native", link)
    expect(markdown, page.slugs.join("/")).not.toContain("@ui-sdk/")
  }
  const installation = await pageMarkdown(
    docPage(["react-native", "installation"])!.file,
    "react-native",
    link
  )
  expect(installation).toContain(
    "npm install @rn-ui-sdk/react-native @rn-ui-sdk/core"
  )
}, 60_000)

test("a React page keeps upstream's package names", async () => {
  const markdown = await pageMarkdown(
    docPage(["react", "installation"])!.file,
    "react",
    link
  )
  expect(markdown).toContain("@ui-sdk/react")
  expect(markdown).not.toContain("@rn-ui-sdk/")
}, 30_000)

test("the native package's docs name the fork's packages", async () => {
  await writePackageDocs(["react-native"])
  const dir = path.join(repoRoot, "packages/react-native/docs")
  const read = (file: string) => readFileSync(path.join(dir, file), "utf8")
  const files = readdirSync(dir, { recursive: true, encoding: "utf8" }).filter(
    (file) => /\.(md|txt)$/.test(file)
  )
  expect(files).toContain("components/switch.md")
  for (const file of files) {
    const text = read(file)
    // Core and Agents cover every framework, so they also name upstream's
    // Vue, Svelte, Solid and web packages.
    const shown = ["core.md", "agents.md"].includes(file)
      ? /@ui-sdk\/(core|react)\b/
      : /@ui-sdk\//
    expect(text, file).not.toMatch(shown)
  }
  expect(read("README.md")).toContain("# @rn-ui-sdk/react-native docs")
  expect(read("core.md")).toContain("@rn-ui-sdk/core")
}, 120_000)
