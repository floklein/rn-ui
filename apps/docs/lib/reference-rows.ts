import path from "node:path"
import { createGenerator } from "fumadocs-typescript"
import ts from "typescript"
import { callbackIn, isCallback, type Framework } from "./frameworks"
import { repoRoot } from "./repo-root"

// API reference rows generated from the core's exported types, so names,
// signatures and descriptions come from the JSDoc and never drift. The site
// renders them as tables, and the Markdown copies as lists.

/** One field of a reference table. */
type Row = {
  name: string
  type?: string
  detail?: string
  text: string
  /** Shown beside the name, like an export's `"experimental"` label. */
  status?: "experimental"
  members?: { name: string; type: string; text: string }[]
  /** The heading on the page whose live example shows the field. */
  example?: { href: string; label: string }
}

const programs = new Map<
  string,
  { checker: ts.TypeChecker; exports: ts.Symbol[] }
>()

// Each module gets its own program, so the order of a union's members, and
// with it a table's rows, never depends on what else was checked first. The
// programs share parsed files, as the language service's do, since parsing
// the core and the DOM types again for every module made prerendering slow.
const options: ts.CompilerOptions = {
  strict: true,
  noEmit: true,
  skipLibCheck: true,
}
const host = ts.createCompilerHost(options)
const parsed = new Map<string, ts.SourceFile | undefined>()
const parse = host.getSourceFile
host.getSourceFile = (fileName, ...rest) => {
  if (!parsed.has(fileName)) {
    parsed.set(fileName, parse.call(host, fileName, ...rest))
  }
  return parsed.get(fileName)
}

// Paths are relative to the docs app, like TypeTable's.
function moduleOf(file: string) {
  const resolved = path.resolve(repoRoot, "apps/docs", file)
  let found = programs.get(resolved)
  if (!found) {
    const program = ts.createProgram([resolved], options, host)
    const checker = program.getTypeChecker()
    const source = program.getSourceFile(resolved)
    if (!source) {
      throw new Error(`No such file: ${file}`)
    }
    found = {
      checker,
      exports: checker.getExportsOfModule(checker.getSymbolAtLocation(source)!),
    }
    programs.set(resolved, found)
  }
  return found
}

function exported(file: string, name: string) {
  const { checker, exports } = moduleOf(file)
  const symbol = exports.find((candidate) => candidate.name === name)
  if (!symbol) {
    throw new Error(`${name} isn't exported from ${file}`)
  }
  return { checker, symbol }
}

const docsOf = (symbol: ts.Symbol, checker: ts.TypeChecker) =>
  ts
    .displayPartsToString(symbol.getDocumentationComment(checker))
    .replace(/\s+/g, " ")
    .trim()

const generator = createGenerator()

// A function's JSDoc, for a table of a module's own exports, like
// `typeof import("./plain-date")`, whose rows the generator leaves bare.
function exportDocs(file: string, name: string) {
  const { checker, exports } = moduleOf(file)
  const symbol = exports.find((candidate) => candidate.name === name)
  if (!symbol) {
    return ""
  }
  return docsOf(
    symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol,
    checker
  )
}

// A prop's name, marked `?` when it's optional. Callbacks are events in Vue
// and on web components, named as those frameworks write them.
function rowName(
  entry: { name: string; required: boolean },
  framework: Framework,
  isEvent: boolean
) {
  if (isEvent && framework === "vue") {
    return callbackIn(entry.name, framework)
  }
  if (isEvent && framework === "web-components") {
    return `${callbackIn(entry.name, framework)} event`
  }
  return entry.required ? entry.name : `${entry.name}?`
}

// The callbacks a description names in `backticks`, as the framework writes them.
const callbacksIn = (text: string, framework: Framework) =>
  text.replace(
    /`(on[A-Z]\w*)`/g,
    (_, name: string) => `\`${callbackIn(name, framework)}\``
  )

/**
 * Props of an exported type, generated from its JSDoc, one list per type the
 * name covers. `events={false}` keeps callbacks as they are in every
 * framework, for options passed to a function, like `toast()`'s.
 */
async function typeRows({
  path: file,
  name,
  framework = "react",
  events = true,
  examples,
  type,
  types,
  descriptions,
  omit = [],
}: {
  path: string
  name: string
  /** Fields the table leaves out, like options a framework's types drop. */
  omit?: string[]
  /** A type to document in place of the export `name`, like `Parameters<typeof definePrimitive>[0]`, which `name` then labels. */
  type?: string
  /** Each field's type as the table shows it, where the declared one reads worse, like a generic's. */
  types?: Record<string, string>
  /** Each field's description as the table shows it, where the declared one fits another part, like a submenu's `controller`. */
  descriptions?: Record<string, string>
  framework?: Framework
  events?: boolean
  /**
   * Each field's example, by the text of the heading above it, like `{ loop: "Disabled items and wrapping" }`.
   * A heading on another page follows its path: `"../kernel/handle-changes#Controlled state"`.
   */
  examples?: Record<string, string>
}) {
  const docs = await generator.generateTypeTable({ path: file, name, type })
  return docs.map((doc) => ({
    id: doc.id,
    label: doc.name,
    rows: nativeEntries(
      doc.entries.filter((entry) => !omit.includes(entry.name)),
      framework
    ).map((entry) => {
      const fallback = entry.tags.find((tag) => tag.name === "default")?.text
      const isEvent = events && isCallback(entry.name)
      return {
        name: rowName(entry, framework, isEvent),
        // Web events carry `detail`, not the callback's arguments.
        type:
          isEvent && framework === "web-components"
            ? undefined
            : (types?.[entry.name] ?? shortType(entry)),
        detail: fallback
          ? `Default ${fallback.replace(/^`|`$/g, "")}`
          : undefined,
        text: callbacksIn(
          (
            descriptions?.[entry.name] ??
            (entry.description ||
              (type?.includes("typeof import(")
                ? exportDocs(file, entry.name)
                : ""))
          )
            .replace(/\s+/g, " ")
            .trim(),
          events ? framework : "react"
        ),
        example: exampleOf(examples, entry.name),
      }
    }),
  }))
}

// What `@ui-sdk/react-native`'s types leave out: options with no native
// meaning, and `modal="trap-focus"`, which the `Modal`'s isolation replaces.
function nativeEntries<Entry extends { name: string; type: string }>(
  entries: Entry[],
  framework: Framework
) {
  if (framework !== "react-native") {
    return entries
  }
  return entries
    .filter(
      (entry) => !["container", "shortcut", "name", "form"].includes(entry.name)
    )
    .map((entry) =>
      entry.name === "modal"
        ? {
            ...entry,
            type: entry.type
              .split(" | ")
              .filter((member) => member !== '"trap-focus"')
              .join(" | "),
          }
        : entry
    )
}

// The declared type, without the `undefined` that optional props add. A
// type too long to read, like a map of every DOM event, shows its outline.
function shortType(entry: { type: string; simplifiedType: string }) {
  const type = entry.type
    .replace(/ \| undefined$/, "")
    .replace(/^undefined \| /, "")
  return type.length > 200 ? entry.simplifiedType : type
}

// Links a field to the heading above its example, by the heading's text, the
// way the page slugs it: "Items that can't take focus" is `#items-that-cant-take-focus`.
// Text after a path and `#` names a heading on that page.
function exampleOf(examples: Record<string, string> | undefined, name: string) {
  const found = examples?.[name.replace(/\?$/, "")]
  if (!found) {
    return undefined
  }
  const [page, label] = found.includes("#") ? found.split("#") : ["", found]
  const id = label
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-")
  return { href: `${page}#${id}`, label }
}

/** A part's render state: every field, its type and what it means. */
function stateRows({ path: file, name }: { path: string; name: string }) {
  const { checker, symbol } = exported(file, name)
  const type = checker.getDeclaredTypeOfSymbol(symbol)
  return checker.getPropertiesOfType(type).map((property) => ({
    name: property.name,
    type: checker.typeToString(checker.getTypeOfSymbol(property)),
    text: docsOf(property, checker),
  }))
}

/** The reasons a callback can report, described from the shared vocabulary in core. */
function reasonRows({ path: file, name }: { path: string; name: string }) {
  const { checker, symbol } = exported(file, name)
  const vocabulary = exported(
    "../../packages/core/src/foundation/kernel/details.ts",
    "ReasonVocabulary"
  )
  const meanings = vocabulary.checker.getDeclaredTypeOfSymbol(vocabulary.symbol)
  const type = checker.getDeclaredTypeOfSymbol(symbol)
  const members = (type.isUnion() ? type.types : [type]).filter((member) =>
    member.isStringLiteral()
  )
  return members.map((member) => {
    const reason = (member as ts.StringLiteralType).value
    const meaning = vocabulary.checker.getPropertyOfType(meanings, reason)
    // The DOM event the reason carries, from the vocabulary's type. None for controllers and cascades.
    const event = meaning
      ? vocabulary.checker.typeToString(
          vocabulary.checker.getTypeOfSymbol(meaning)
        )
      : ""
    return {
      name: reason,
      type: event === "undefined" ? "none" : event,
      text: meaning ? docsOf(meaning, vocabulary.checker) : "",
    }
  })
}

/** A controller's methods, with their signatures and descriptions. */
function controllerRows({ path: file, name }: { path: string; name: string }) {
  const { checker, symbol } = exported(file, name)
  const type = checker.getDeclaredTypeOfSymbol(symbol)
  return checker
    .getPropertiesOfType(type)
    .filter(
      (property) =>
        !property.getJsDocTags(checker).some((tag) => tag.name === "internal")
    )
    .map((property) => {
      const signature = checker.getSignaturesOfType(
        checker.getTypeOfSymbol(property),
        ts.SignatureKind.Call
      )[0]
      const parameters = signature
        ? signature.parameters
            .map((parameter) => {
              const declaration = parameter.valueDeclaration as
                ts.ParameterDeclaration | undefined
              return `${parameter.name}${declaration?.questionToken ? "?" : ""}`
            })
            .join(", ")
        : ""
      return {
        name: signature ? `${property.name}(${parameters})` : property.name,
        type: checker.typeToString(checker.getTypeOfSymbol(property)),
        text: docsOf(property, checker),
      }
    })
}

export { controllerRows, reasonRows, type Row, stateRows, typeRows }
