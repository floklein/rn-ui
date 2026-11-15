import path from "node:path"
import {
  coreEntries,
  exportsByLayer,
  layerTitle,
  type CoreExport,
} from "./core-exports"
import { cssVariableTable } from "./css-variables"
import { dataAttributeTables } from "./data-attributes"
import { readExampleSources } from "./example-sources"
import { frameworks, type Framework } from "./frameworks"
import { contentDir, docPage, docPages, readPage, withIncludes } from "./pages"
import { partStateRows } from "./part-state"
import { publishedNames } from "./published-names"
import {
  controllerRows,
  reasonRows,
  stateRows,
  typeRows,
  type Row,
} from "./reference-rows"
import { frameworkPages, utilitiesFolder } from "./sections"
import { listOf, sentence, specGroups } from "./spec-groups"

// A docs page as Markdown, for agents and for the copies the packages ship,
// with every generated table written out as a list. Links go through `link`, which gets the page a link points to
// and returns where it should go, or null to keep only its text.

/**
 * Where a link points: a page's slugs, like `["react", "components", "field"]`,
 * and a heading. A link from Core or Agents to a framework's page names no
 * framework, like `["components", "field"]`.
 */
type LinkTarget = { slugs: string[]; hash?: string }

type PageLinks = (target: LinkTarget) => string | null

/**
 * `compact` writes a page for a file that holds many pages, like a
 * framework's llms.txt: no examples or test lists, one sentence per prop,
 * reasons and state as names, and links to the page's own headings go to the
 * page. `lean` writes a page for the packaged docs: every example after the
 * page's first drops its static class lists, which are most of its size.
 */
type PageOptions = { compact?: boolean; lean?: boolean }

// The tag's attributes: `name="text"`, `name='text'`, `name={["a", "b"]}`, `name={false}` or `name={{ key: "text" }}`.
function attributes(source: string) {
  const found: Record<string, string> = {}
  for (const match of source.matchAll(
    /(\w+)=(?:"([^"]*)"|'([^']*)'|\{\{((?:"[^"]*"|'[^']*'|[^}"'])*)\}\}|\{([^}]*)\})/g
  )) {
    found[match[1]] =
      match[2] ??
      match[3] ??
      (match[4] === undefined ? match[5] : `{${match[4]}}`)
  }
  return found
}

// `{ loop: "Disabled items and wrapping" }`, as written in a tag, into an object.
function objectOf(source: string | undefined) {
  if (!source) {
    return undefined
  }
  return Object.fromEntries(
    [...source.matchAll(/(\w+):\s*"([^"]*)"/g)].map((match) => [
      match[1],
      match[2],
    ])
  )
}

const rowList = (rows: Row[]) =>
  rows
    .map((row) =>
      [
        `- \`${row.name}\`${row.status ? ` (${row.status})` : ""}${row.type ? ` (\`${row.type}\`)` : ""}${row.detail ? `, ${row.detail.toLowerCase()}` : ""}${row.text ? `: ${row.text}` : ""}${row.example ? ` Example: [${row.example.label}](${row.example.href}).` : ""}`,
        ...(row.members ?? []).map(
          (member) =>
            `  - \`${member.name}: ${member.type}\`${member.text ? `: ${member.text}` : ""}`
        ),
      ].join("\n")
    )
    .join("\n")

// A short description, or a long one's first sentence. One that lists its
// values, like "`false`: … `true`: …", is kept whole.
const firstSentence = (text: string) =>
  text.length <= 200 || text.startsWith("`")
    ? text
    : (text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text)

// Rows in a few words each: a short type stays, a long one is on the page.
const compactRows = (rows: Row[]) =>
  rows
    .map((row) => {
      const facts = [
        row.type && row.type.length <= 40 ? `\`${row.type}\`` : "",
        row.detail?.toLowerCase(),
      ]
      const said = facts.filter(Boolean).join(", ")
      return `- \`${row.name}\`${said ? ` (${said})` : ""}${row.text ? `: ${firstSentence(row.text)}` : ""}`
    })
    .join("\n")

// Rows as their names on one line.
const nameList = (rows: Row[]) =>
  `${rows.map((row) => `\`${row.name}\``).join(", ")}.`

const exportList = (entries: CoreExport[]) =>
  rowList(
    entries.map((entry) => ({
      name: entry.signature,
      status: entry.experimental ? ("experimental" as const) : undefined,
      text: entry.text,
      members: entry.members,
    }))
  )

// Runs `replace` on the text outside fenced code blocks, so code that shows a
// tag, like `<Progress />`, stays as written.
async function outsideCode(
  text: string,
  replace: (prose: string) => Promise<string>
) {
  const parts = text.split(/^( *```[\s\S]*?^ *```)$/m)
  const replaced = await Promise.all(
    parts.map((part, index) => (index % 2 ? part : replace(part)))
  )
  return replaced.join("")
}

async function replaceAsync(
  text: string,
  pattern: RegExp,
  replace: (...match: string[]) => Promise<string>
) {
  const matches = [...text.matchAll(pattern)]
  const values = await Promise.all(matches.map((match) => replace(...match)))
  let index = 0
  return text.replace(pattern, () => values[index++])
}

// Example code without its static class lists, except ones holding a class
// the code selects, like `.grid`. A tag whose other attributes now fit on one
// line is joined back onto it.
const unstyled = (code: string) =>
  code
    .replace(/\s+(?:class|className)="([^"]*)"/g, (list, names: string) =>
      names.split(/\s+/).some((name) => name && code.includes(`.${name}`))
        ? list
        : ""
    )
    .replace(
      /^( *)<([\w.:-]+)((?:\n +[^\n<>]+)*)\n *(\/?>)$/gm,
      (tag, indent, name, attrs, end) => {
        const line = `${indent}<${[name, ...attrs.split("\n").map((attr: string) => attr.trim())].filter(Boolean).join(" ")}${end === "/>" ? " />" : ">"}`
        return line.length <= 110 ? line : tag
      }
    )

// A component's tag, self-closing, with attributes that may span lines.
const tag = (name: string) =>
  new RegExp(
    `<${name}\\b((?:\\s+\\w+(?:="[^"]*"|='[^']*'|=\\{\\{(?:"[^"]*"|'[^']*'|[^}"'])*\\}\\}|=\\{[^}]*\\}))*)\\s*\\/>`,
    "g"
  )

/**
 * The page at `file` as Markdown, its links mapped by `link`. `framework` is
 * the page's section's, for tables and code that differ by framework; Core and
 * Agents pages have none.
 */
async function pageMarkdown(
  file: string,
  framework: Framework | undefined,
  link: PageLinks,
  { compact = false, lean = false }: PageOptions = {}
) {
  const { title, description, body } = readPage(file)
  const dir = path
    .relative(contentDir, path.dirname(file))
    .split(path.sep)
    .join("/")
  const shown = framework ?? "react"
  const rows = compact ? compactRows : rowList

  // Links in the content are relative to their file, like ./menu or ../../core/popups#layers.
  const target = (href: string) => {
    if (href.startsWith("#") && compact) {
      const slugs = path
        .relative(contentDir, file)
        .replace(/\.mdx$/, "")
        .split(path.sep)
      return link({
        slugs: slugs.filter((slug) => slug !== "index"),
        hash: href.slice(1),
      })
    }
    if (href.startsWith("#") || /^[a-z]+:/.test(href)) {
      return href
    }
    const [to, hash] = href.split("#")
    // A site page outside the docs, like /why, has no copy to link to.
    if (to.startsWith("/") && !to.startsWith("/docs/")) {
      return null
    }
    const resolved = to.startsWith("/")
      ? to.slice("/docs/".length)
      : path.posix.join(dir, to)
    let slugs = resolved.split("/").filter((slug) => slug && slug !== "index")
    // A link that names no framework means this page's framework's, when it has one.
    if (framework && frameworkPages.includes(slugs[0])) {
      slugs = [
        framework,
        slugs[0] === "utilities" ? utilitiesFolder(framework) : slugs[0],
        ...slugs.slice(1),
      ]
    }
    return link({ slugs, hash })
  }

  // With `lean`, only the page's first example keeps its class lists.
  const [, firstExample = ""] = tag("ComponentExample").exec(body) ?? []
  const styledExample = lean ? attributes(firstExample).name : undefined

  // Markdown carries the CSS block of a style snippet; the Tailwind one is a site toggle.
  const setupPrompt = () =>
    withIncludes(
      "<include>setup-prompt.mdx</include>",
      path.join(contentDir, "../shared")
    )
  let text = body
    .replace(tag("CopyPrompt"), setupPrompt)
    .replace(
      tag("Video"),
      (_, attrs: string) => `[Watch the launch video](${attributes(attrs).src})`
    )
    .replace(/<StyleTabs>\s*(```[\s\S]*?\n```)[\s\S]*?<\/StyleTabs>/g, "$1")
  text = await outsideCode(text, async (prose) => {
    let out = prose
      .replace(/<\/?(?:Cards|Callout|Steps)>\n?/g, "")
      .replace(/<\/?FrameworkTabs\b[^>]*>\n?/g, "")
      .replace(
        /<Framework(?:Content|Tab)\s+value="([^"]+)">/g,
        (_, value: string) => {
          const label = frameworks[value as Framework]?.label ?? value
          return `**${label}**\n`
        }
      )
      .replace(/<\/Framework(?:Content|Tab)>\n?/g, "")
      .replace(/<Collapsible\b([^>]*)>/g, (_, attrs: string) => {
        const { title } = attributes(attrs)
        return title ? `**${title}**\n` : ""
      })
      .replace(/<\/Collapsible>\n?/g, "")
      .replace(/<Won>(.*?)<\/Won>/g, "**$1**")
      .replace(/^[ \t]+(?=<Card\b)/gm, "")
      .replace(tag("Card"), (_, attrs: string) => {
        const { title, description, href } = attributes(attrs)
        return `- [${title}](${href})${description ? `: ${description}` : ""}`
      })
      .replace(tag("ComponentCards"), (_, attrs: string) =>
        attributes(attrs)
          .names.split(" ")
          .flatMap((name) => docPage([shown, "components", name]) ?? [])
          .map(
            (page) =>
              `- [${page.title}](/docs/components/${page.slugs[2]})${page.description ? `: ${page.description}` : ""}`
          )
          .join("\n")
      )
      .replace(tag("ComponentGrid"), () =>
        docPages(`${shown}/components`)
          .filter((page) => page.slugs.length === 3)
          .map(
            (page) =>
              `- [${page.title}](./${page.slugs[2]})${page.description ? `: ${page.description}` : ""}`
          )
          .join("\n")
      )
      .replace(tag("ChangelogPosts"), () =>
        docPages("core/changelog")
          .filter((page) => page.slugs.length === 3 && page.date)
          .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
          .map(
            (page) =>
              `- ${page.date}: [${page.title}](./${page.slugs[2]})${page.description ? `: ${page.description}` : ""}`
          )
          .join("\n")
      )
      .replace(tag("CoreExports"), (_, attrs: string) => {
        const { layer } = attributes(attrs)
        return exportsByLayer(layer)
          .filter((group) => group.entries.length)
          .map((group) =>
            layer === "other"
              ? `### ${layerTitle(group.layer)}\n\n${exportList(group.entries)}`
              : exportList(group.entries)
          )
          .join("\n\n")
      })
      .replace(tag("CoreEntries"), () =>
        coreEntries()
          .map(({ entry, page, href, names }) => {
            const documented = page ? `[${page.title}](${href})` : ""
            return `- \`${entry}\`: ${documented || names.map((name) => `\`${name}\``).join(", ")}`
          })
          .join("\n")
      )
      .replace(tag("StateTable"), (_, attrs: string) => {
        const found = stateRows(
          attributes(attrs) as { path: string; name: string }
        )
        return compact ? nameList(found) : rowList(found)
      })
      .replace(tag("PartStateTable"), (_, attrs: string) => {
        const found = partStateRows(
          attributes(attrs) as Parameters<typeof partStateRows>[0]
        )
        return compact ? nameList(found) : rowList(found)
      })
      .replace(tag("ReasonTable"), (_, attrs: string) => {
        const found = reasonRows(
          attributes(attrs) as { path: string; name: string }
        )
        return compact ? nameList(found) : rowList(found)
      })
      .replace(tag("ControllerTable"), (_, attrs: string) =>
        rows(
          controllerRows(
            attributes(attrs) as { path: string; name: string }
          ).map((row) => ({
            ...row,
            type: compact ? undefined : row.type,
          }))
        )
      )

    out = await replaceAsync(
      out,
      tag("TypeTable"),
      async (_, attrs: string) => {
        const {
          path: file,
          name,
          events,
          examples,
          type,
          types,
          descriptions,
        } = attributes(attrs)
        const tables = await typeRows({
          path: file,
          name,
          type,
          framework: shown,
          events: events !== "false",
          examples: objectOf(examples),
          types: objectOf(types),
          descriptions: objectOf(descriptions),
        })
        return tables.map((table) => rows(table.rows)).join("\n\n")
      }
    )
    out = await replaceAsync(
      out,
      tag("ComponentExample"),
      async (_, attrs: string) => {
        // Core guides show their shared primitives and framework bindings inline.
        const { name, caption } = attributes(attrs)
        if (compact || !framework) {
          return caption ?? ""
        }
        const styled = !lean || name === styledExample
        const sources = await readExampleSources(name, framework)
        if (!sources) {
          return caption ?? ""
        }
        const blocks = (
          files: { name: string; lang: string; code: string }[]
        ) =>
          files
            .map(
              (file) =>
                `\`\`\`${file.lang} title="${file.name}"\n${styled ? file.code : unstyled(file.code)}\n\`\`\``
            )
            .join("\n\n")
        const block = blocks(sources.files)
        return [block, caption].filter(Boolean).join("\n\n")
      }
    )
    out = await replaceAsync(out, tag("SpecList"), async (_, attrs: string) => {
      if (compact) {
        return ""
      }
      const { spec, only } = attributes(attrs)
      const { groups, frameworks: ran } = await specGroups(
        spec,
        only
          ? [...only.matchAll(/"([^"]*)"/g)].map((match) => match[1])
          : undefined
      )
      const tests = groups
        .map((group) =>
          [
            group.title ? `**${sentence(group.title)}**\n` : "",
            ...group.tests.map(
              (test) =>
                `- ${sentence(test.title)}.${test.frameworks.length > 0 && test.frameworks.length < ran.length ? ` ${sentence(listOf(test.frameworks))} only.` : ""}`
            ),
          ]
            .filter(Boolean)
            .join("\n")
        )
        .join("\n\n")
      return ran.length ? `${tests}\n\nRuns in ${listOf(ran)}.` : tests
    })
    out = await replaceAsync(
      out,
      tag("DataAttributes"),
      async (_, attrs: string) => {
        const { component = "menu", part } = attributes(attrs)
        const { styled } = await dataAttributeTables(component, shown)
        // A page not yet split into a section per part lists every part.
        return styled
          .filter((each) => !part || each.slot === part)
          .map((found) =>
            [
              `${part ? "" : `**${found.name}** `}\`[data-slot="${found.dataSlot}"]\``,
              "",
              ...found.attributes.map(
                ({ attribute, values, text }) =>
                  `- \`${attribute}\`${values.length ? ` (${values.map((value) => `\`${value}\``).join(", ")})` : ""}${text && !compact ? `: ${text}` : ""}`
              ),
            ].join("\n")
          )
          .join("\n\n")
      }
    )
    out = out.replace(tag("CssVariables"), (_, attrs: string) => {
      const { component = "menu", part } = attributes(attrs)
      const found = cssVariableTable(component, shown).find(
        (each) => each.part === part
      )
      if (!found) {
        return ""
      }
      return found.variables
        .map(({ name, text }) => `- \`${name}\`${compact ? "" : `: ${text}`}`)
        .join("\n")
    })

    // Links last, so the ones tables and cards add are mapped too.
    return out.replace(
      /\[([^\]]*)\]\(([^)\s]+)\)/g,
      (_, label: string, href: string) => {
        const mapped = target(href)
        return mapped === null ? label : `[${label}](${mapped})`
      }
    )
  })

  // A heading's custom anchor, like `### AccordionPanel [#styling-accordionpanel]`, is the site's.
  text = text.replace(/^(#{1,6} .*?)\s*\[#[\w-]+\]\s*$/gm, "$1")
  return publishedNames(
    `# ${title}\n\n${description ? `${description}\n\n` : ""}${text.replace(/\n{3,}/g, "\n\n").trim()}\n`,
    framework
  )
}

export { type LinkTarget, type PageLinks, pageMarkdown, type PageOptions }
