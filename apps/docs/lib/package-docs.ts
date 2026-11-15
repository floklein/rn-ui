import { mkdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import {
  customElementsManifest,
  describeElements,
  htmlCustomData,
} from "./custom-elements"
import { frameworkIds, frameworks, type Framework } from "./frameworks"
import { frameworkLlms } from "./llms"
import { pageMarkdown, type LinkTarget } from "./page-markdown"
import { publishedNames } from "./published-names"
import { docPage, docPages, frameworkGuides } from "./pages"
import { repoRoot } from "./repo-root"
import { frameworkPages, utilitiesFolder } from "./sections"
import { sectionMarkdown } from "./section-markdown"

// The docs as Markdown inside each package, so whoever installs one reads
// them in node_modules, with no access to the site: Core and Agents as one
// file each, and every page of the package's framework.

/** Each package and the framework whose pages it ships. Core ships Core and Agents only. */
const packageFrameworks: Record<string, Framework | undefined> = {
  core: undefined,
  react: "react",
  vue: "vue",
  svelte: "svelte",
  solid: "solid",
  web: "web-components",
  "react-native": "react-native",
}

const guidesByFramework = new Map(
  frameworkIds.map((framework) => [framework, frameworkGuides(framework)])
)

// A heading's anchor, the way GitHub and most Markdown viewers make it.
const anchor = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")

// The file a page is copied to in a package for `framework`, relative to the
// docs folder, or null for a page with no copy there, like another
// framework's. Core and Agents are one file each, so their pages are headings.
function fileOf({ slugs, hash }: LinkTarget, framework: Framework | undefined) {
  const [section, ...rest] = slugs
  if (section === "core" || section === "agents") {
    const page = rest.length ? docPage(slugs) : undefined
    const file = section === "agents" ? "agents.md" : "core.md"
    return `${file}${hash ? `#${hash}` : page ? `#${anchor(page.title)}` : ""}`
  }
  if (!framework) {
    return null
  }
  // A link that names no framework, from Core or Agents, is this framework's.
  const [folder, name] = frameworkPages.includes(section)
    ? [section === "utilities" ? utilitiesFolder(framework) : section, rest[0]]
    : section === framework
      ? rest
      : []
  const at = hash ? `#${hash}` : ""
  if (section === framework && !folder) {
    return `introduction.md${at}`
  }
  if (
    folder &&
    guidesByFramework.get(framework)!.some((page) => page.slugs[1] === folder)
  ) {
    return `${folder}.md${at}`
  }
  if (folder === "components" || folder === utilitiesFolder(framework)) {
    return `${name ? `${folder}/${name}.md` : "README.md"}${at}`
  }
  return null
}

// Maps a link from the file at `from` to the copy it points to.
const linksFrom =
  (from: string, framework: Framework | undefined) => (target: LinkTarget) => {
    const file = fileOf(target, framework)
    if (file === null) {
      return null
    }
    const relative =
      path.posix.relative(path.posix.dirname(from), file.split("#")[0]) ||
      path.posix.basename(from)
    return `${relative.startsWith(".") ? "" : "./"}${relative}${file.includes("#") ? `#${file.split("#")[1]}` : ""}`
  }

// The pages a framework's package ships, besides Core and Agents.
const frameworkFiles = (framework: Framework) => [
  ...[["components"], [utilitiesFolder(framework)]].flatMap(([folder]) =>
    docPages(`${framework}/${folder}`)
      .filter((page) => page.slugs.length === 3)
      .map((page) => ({ page, file: `${folder}/${page.slugs[2]}.md` }))
  ),
  ...guidesByFramework.get(framework)!.map((page) => ({
    page,
    file: `${page.slugs[1] ?? "introduction"}.md`,
  })),
]

// The docs folder's index: every page, with what it's for.
function index(name: string, framework: Framework | undefined) {
  const core = docPage(["core"])!
  const agents = docPage(["agents"])!
  const llms = framework
    ? `Start with [llms.txt](./llms.txt): how the components fit together, then an index of every component, in one file for an agent's context. Each page below has the rest.\n\n`
    : `[llms.txt](./llms.txt) is the Core docs, the same as core.md, under the name agents look for.\n\n`
  const shared = `## Core and Agents

- [Core](./core.md): ${core.description} Every Core page in one file.
- [Agents](./agents.md): ${agents.description} Every Agents page in one file.
`
  if (!framework) {
    return `# @ui-sdk/${name} docs

The ui-sdk docs for the framework-free core, as Markdown, for the release this package came from. Each framework's package has its own pages, like \`@ui-sdk/react/docs\`.

${llms}${shared}
## Skills

- [ui-sdk](../skills/ui-sdk/SKILL.md): builds interfaces with ui-sdk, components it doesn't ship from the behaviors in this package, agent support and tests.
`
  }
  const list = (folder: string) =>
    frameworkFiles(framework)
      .filter(({ file }) => file.startsWith(`${folder}/`))
      .map(
        ({ page, file }) =>
          `- [${page.title}](./${file})${page.description ? `: ${page.description}` : ""}`
      )
      .join("\n")
  const guides = frameworkFiles(framework)
    .filter(({ file }) => !file.includes("/"))
    .map(
      ({ page, file }) => `- [${page.title}](./${file}): ${page.description}`
    )
    .join("\n")
  return `# @ui-sdk/${name} docs

The ui-sdk docs for ${frameworks[framework].label}, as Markdown. Every page here is generated from the same source as the docs site, for the release this package came from.

${llms}${shared}
## Components

${list("components")}
${list(utilitiesFolder(framework)) ? `\n## ${framework === "react" ? "Hooks" : "Utilities"}\n\n${list(utilitiesFolder(framework))}\n` : ""}
## Framework Guides

${guides}
`
}

/** Writes `packages/<name>/docs` for each package, replacing what's there. */
async function writePackageDocs(names = Object.keys(packageFrameworks)) {
  for (const name of names) {
    const framework = packageFrameworks[name]
    const dir = path.join(repoRoot, "packages", name, "docs")
    await rm(dir, { recursive: true, force: true })
    const files: Record<string, string> = {
      "README.md": index(name, framework),
    }
    for (const section of ["core", "agents"] as const) {
      files[`${section}.md`] = await sectionMarkdown(
        section,
        (slugs, hash) => linksFrom(`${section}.md`, framework)({ slugs, hash }),
        `<!-- ui-sdk ${section === "core" ? "Core" : "Agents"} docs, as one file. -->`
      )
    }
    files["llms.txt"] = framework
      ? await frameworkLlms(framework, linksFrom("llms.txt", framework))
      : await sectionMarkdown("core", (slugs, hash) =>
          linksFrom("llms.txt", framework)({ slugs, hash })
        )
    if (framework)
    // Component and utility pages are in folders; guides keep every example styled.
    {
      for (const { page, file } of frameworkFiles(framework)) {
        files[file] = await pageMarkdown(
          page.file,
          framework,
          linksFrom(file, framework),
          {
            lean: file.includes("/"),
          }
        )
      }
    }
    for (const [file, text] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(dir, file)), { recursive: true })
      await writeFile(path.join(dir, file), publishedNames(text, framework))
    }
    console.log(`packages/${name}/docs: ${Object.keys(files).length} files`)
    if (name === "web") {
      await writeElementsManifest(path.join(repoRoot, "packages", name))
    }
  }
}

/**
 * Writes the web package's `custom-elements.json`, which its package.json's
 * `customElements` points to, and `html-custom-data.json` for VS Code into
 * `dir`, and lists what has no description yet.
 */
async function writeElementsManifest(dir: string) {
  const { entries, elements, missing } = await describeElements()
  await writeFile(
    path.join(dir, "custom-elements.json"),
    `${JSON.stringify(customElementsManifest(elements, entries), null, 2)}\n`
  )
  await writeFile(
    path.join(dir, "html-custom-data.json"),
    `${JSON.stringify(htmlCustomData(elements), null, 2)}\n`
  )
  console.log(
    `${path.relative(repoRoot, dir)}: custom-elements.json and html-custom-data.json, ${elements.length} elements`
  )
  if (missing.length) {
    console.warn(
      `Not described yet:\n${missing.map((item) => `  ${item}`).join("\n")}`
    )
  }
  return { elements, missing }
}

export { packageFrameworks, writeElementsManifest, writePackageDocs }
