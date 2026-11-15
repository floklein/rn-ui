import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { expect, test } from "vitest"
import {
  cssVariableGroups,
  cssVariableMeaning,
  cssVariableTable,
} from "./css-variables"
import { dataAttributeTables, hasDataAttributes } from "./data-attributes"
import { frameworkIds, isCodeOnly } from "./frameworks"
import { contentDir } from "./pages"
import { repoRoot } from "./repo-root"

const core = path.join(repoRoot, "packages/core")
const src = path.join(core, "src")

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return sourceFiles(file)
    }
    return entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")
      ? [file]
      : []
  })

const code = (file: string) =>
  readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1")

// The variables a file writes: whole names, and the prefix of a name it
// builds, like `--active-tab-${name}`. A name inside a `var()` is one it reads.
function written(file: string) {
  const source = code(file).replace(/var\(--[\w-]+/g, "")
  const names = new Set<string>()
  for (const [, name, built] of source.matchAll(
    /["'`;](--[a-z][\w-]*)(\$\{)?/g
  )) {
    names.add(built ? `${name}*` : name)
  }
  return names
}

// Scroll locking sets this on <html> for any modal popup; the docs don't list it.
const undocumented = ["--scrollbar-width"]

const covers = (declared: string[], name: string) =>
  undocumented.includes(name) ||
  (name.endsWith("*")
    ? declared.some((each) => each.startsWith(name.slice(0, -1)))
    : declared.includes(name))

const declared = (component: string) =>
  (cssVariableGroups[component] ?? []).flatMap((group) => group.variables)

// The files a component's entry reaches through imports that aren't only types.
function reached(entry: string) {
  const seen = new Set<string>()
  const stack = [entry]
  while (stack.length) {
    const file = stack.pop()!
    if (seen.has(file)) {
      continue
    }
    seen.add(file)
    for (const [, kind, names, from, lazy] of readFileSync(
      file,
      "utf8"
    ).matchAll(
      /(?:import|export)\s+(type\s+)?([^"';]*?)\s*from\s*"([^"]+)"|import\("([^"]+)"\)/g
    )) {
      if (kind) {
        continue
      }
      const list = names?.trim() ?? ""
      if (
        /^\{[^}]*\}$/.test(list) &&
        list
          .slice(1, -1)
          .split(",")
          .filter((name) => name.trim())
          .every((name) => name.trim().startsWith("type "))
      ) {
        continue
      }
      const spec = from ?? lazy
      if (!spec.startsWith(".")) {
        continue
      }
      const base = path.resolve(path.dirname(file), spec)
      const resolved = [base, `${base}.ts`, path.join(base, "index.ts")].find(
        (candidate) => candidate.endsWith(".ts") && existsSync(candidate)
      )
      if (resolved) {
        stack.push(resolved)
      }
    }
  }
  return seen
}

const exportsMap = JSON.parse(
  readFileSync(path.join(core, "package.json"), "utf8")
).exports as Record<string, unknown>
const entries = Object.entries(exportsMap).flatMap(([key, value]) =>
  typeof value === "string" && value.includes("/components/")
    ? [[key.slice(2), path.join(core, value)] as const]
    : []
)

// Shared helpers and the variables they write. A component that reaches one
// lists them, unless it's below with the reason it never runs that code.
const helpers = {
  "foundation/platform/position.ts": "a popup placed beside its anchor",
  "foundation/platform/keyboard.ts":
    "a dialog, sheet or toast region that follows the keyboard",
  "foundation/popups/sheet-effects.ts": "a sheet",
  "foundation/popups/sheet-presentation.ts": "a popup that presents as a sheet",
  "foundation/popups/modal.ts": "a modal popup's scroll lock",
}

const unreached: Record<
  string,
  Partial<Record<keyof typeof helpers, string>>
> = {
  "alert-dialog": {
    "foundation/platform/position.ts":
      "Alert Dialog isn't placed beside its trigger.",
    "foundation/popups/sheet-effects.ts":
      "Alert Dialog never presents as a sheet.",
    "foundation/popups/sheet-presentation.ts":
      "Alert Dialog never presents as a sheet.",
  },
  drawer: {
    "foundation/platform/position.ts":
      "A drawer isn't placed beside its trigger.",
    "foundation/popups/sheet-presentation.ts":
      "A drawer is a sheet of its own; its backdrop is a part.",
  },
  dialog: {
    "foundation/platform/position.ts":
      "A dialog isn't placed beside its trigger.",
  },
  toast: { "foundation/popups/modal.ts": "The toast region is never modal." },
  tooltip: { "foundation/popups/modal.ts": "A tooltip is never modal." },
  "hover-card": {
    "foundation/popups/modal.ts": "A hover card is never modal.",
  },
  "navigation-menu": {
    "foundation/popups/modal.ts": "A navigation menu is never modal.",
  },
  "date-picker": {
    "foundation/popups/modal.ts": "Date Picker's calendar is never modal.",
  },
  "trigger-menu": {
    "foundation/popups/modal.ts": "Trigger Menu's list is never modal.",
    "foundation/platform/keyboard.ts":
      "Trigger Menu's list never presents as a sheet.",
    "foundation/popups/sheet-effects.ts":
      "Trigger Menu's list never presents as a sheet.",
    "foundation/popups/sheet-presentation.ts":
      "Trigger Menu's list never presents as a sheet.",
  },
}

// Building blocks no component uses. Their own pages document them.
const behaviors = [
  "foundation/direct-manipulation/",
  "foundation/drag-and-drop/",
  "foundation/canvas/",
  "foundation/lists/scroll-picker.ts",
]

test("every variable listed for a component is one core writes, with what it holds", () => {
  const all = sourceFiles(src).flatMap((file) => [...written(file)])
  for (const component of Object.keys(cssVariableGroups)) {
    for (const name of declared(component)) {
      expect(
        all.some(
          (each) =>
            each === name ||
            (each.endsWith("*") && name.startsWith(each.slice(0, -1)))
        ),
        `${component}: ${name}`
      ).toBe(true)
      expect(cssVariableMeaning[name], name).toBeTruthy()
    }
  }
})

test("every variable core writes is listed for the components that write it", () => {
  const listed = Object.keys(cssVariableGroups).flatMap(declared)
  for (const file of sourceFiles(src)) {
    const relative = path.relative(src, file)
    if (behaviors.some((folder) => relative.startsWith(folder))) {
      continue
    }
    for (const name of written(file)) {
      expect(covers(listed, name), `${name} in ${relative}`).toBe(true)
    }
  }
  for (const [component, entry] of entries) {
    const files = reached(entry)
    const own = [...files].filter((file) =>
      path.relative(src, file).startsWith(`components/${component}/`)
    )
    for (const file of own) {
      for (const name of written(file)) {
        expect(
          covers(declared(component), name),
          `${component}: ${name} in ${path.relative(src, file)}`
        ).toBe(true)
      }
    }
    for (const helper of Object.keys(helpers) as (keyof typeof helpers)[]) {
      if (
        !files.has(path.join(src, helper)) ||
        unreached[component]?.[helper]
      ) {
        continue
      }
      const names = declared(component)
      for (const name of written(path.join(src, helper))) {
        expect(
          covers(names, name),
          `${component} reaches ${helper} (${helpers[helper]}) but doesn't list ${name}`
        ).toBe(true)
      }
    }
  }
})

const section = (source: string, title: string) =>
  source.match(
    new RegExp(`^## ${title}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m")
  )?.[1] ?? ""

// The tags under each `### Part [#anchor]` heading of a section, by anchor.
const parts = (body: string) =>
  [
    ...body.matchAll(
      /^### .+? \[#([\w-]+)\]\n([\s\S]*?)(?=^### |(?![\s\S]))/gm
    ),
  ].map(([, id, text]) => ({
    id,
    text,
  }))

const allPages = frameworkIds.flatMap((framework) =>
  readdirSync(path.join(contentDir, framework, "components"))
    .filter((name) => name.endsWith(".mdx"))
    .map((file) => ({
      framework,
      component: file.replace(/\.mdx$/, ""),
      page: `${framework}/${file}`,
      source: readFileSync(
        path.join(contentDir, framework, "components", file),
        "utf8"
      ),
    }))
)

const pages = allPages.filter((page) => !isCodeOnly(page.framework))

// A native part has no data attributes or CSS variables: its state replaces both.
test("a native page has a Part State section per part with data attributes", async () => {
  for (const { framework, component, page, source } of allPages) {
    if (!isCodeOnly(framework) || !hasDataAttributes(component)) {
      continue
    }
    expect(source, page).not.toMatch(/<(?:DataAttributes|CssVariables)\b/)
    const states = parts(section(source, "Part State"))
    for (const part of (await dataAttributeTables(component, framework))
      .styled) {
      expect(
        states.some(
          (each) =>
            each.id.startsWith("part-state-") &&
            each.text.includes(
              `<PartStateTable\n  component="${component}"\n  part="${part.slot}"`
            )
        ),
        `${page}: no Part State section for ${part.name}`
      ).toBe(true)
    }
  }
})

test("Styling has a section per part that carries CSS variables", () => {
  for (const { component, page, source } of pages) {
    const styling = parts(section(source, "Styling"))
    const tags = [...source.matchAll(/<CssVariables\b[^>]*\/>/g)].map(
      ([tag]) => tag
    )
    expect(
      tags.length,
      `${page}: every CssVariables is under a Styling part heading`
    ).toBe(styling.filter((part) => part.text.includes("<CssVariables")).length)
    for (const group of cssVariableTable(component, "react")) {
      const found = styling.find((part) =>
        part.text.includes(
          `<CssVariables component="${component}" part="${group.part}" />`
        )
      )
      expect(
        found,
        `${page}: no Styling section for ${group.name}'s CSS variables`
      ).toBeDefined()
    }
  }
})

test("Data Attributes has a section per part that has data attributes", async () => {
  for (const { framework, component, page, source } of pages) {
    const sections = [...source.matchAll(/^## (.+)$/gm)].map(
      ([, heading]) => heading
    )
    const attributes = parts(section(source, "Data Attributes"))
    const tags = [...source.matchAll(/<DataAttributes\b[^>]*\/>/g)].map(
      ([tag]) => tag
    )
    expect(
      tags.length,
      `${page}: every DataAttributes is under a Data Attributes part heading`
    ).toBe(
      attributes.filter((part) => part.text.includes("<DataAttributes")).length
    )
    const shown = new Set([
      ...(hasDataAttributes(component) ? [component] : []),
      ...tags.map((tag) => /component="([\w-]+)"/.exec(tag)?.[1] ?? "menu"),
    ])
    for (const name of shown) {
      for (const part of (await dataAttributeTables(name, framework)).styled) {
        expect(
          attributes.some((each) =>
            each.text.includes(
              `<DataAttributes component="${name}" part="${part.slot}" />`
            )
          ),
          `${page}: no Data Attributes section for ${part.name}`
        ).toBe(true)
      }
    }
    if (tags.length) {
      const at = sections.indexOf("Data Attributes")
      expect(sections[at - 1], `${page}: Data Attributes follows Styling`).toBe(
        "Styling"
      )
      expect(
        sections.indexOf("API Reference"),
        `${page}: Data Attributes comes before API Reference`
      ).toBeGreaterThan(at)
    }
  }
})

test("a part section's anchor doesn't take the API Reference entry's", () => {
  for (const { page, source } of pages) {
    for (const { id } of [
      ...parts(section(source, "Styling")),
      ...parts(section(source, "Data Attributes")),
    ]) {
      expect(id, page).toMatch(/^(styling|data-attributes)-/)
    }
  }
  expect(
    cssVariableTable("popover", "web-components").map((group) => group.name)
  ).toEqual(["<ui-popover-content>", "<ui-popover-viewport>"])
})
