import { readFileSync } from "node:fs"
import path from "node:path"
import ts from "typescript"
import { repoRoot } from "./repo-root"
import { docPage, sharedHref } from "./pages"

// The core's public surface, read from `@ui-sdk/core`'s entry and package.json,
// so the reference lists every export with its JSDoc and a new one shows up on its own.

const core = path.resolve(repoRoot, "packages/core")
const coreSource = path.join(core, "src")

// The layers the reference has a section for, in import order. Exports from
// any other folder are listed under `layer="other"`.
const coreLayers = [
  "kernel",
  "platform",
  "focus",
  "selection",
  "drag-and-drop",
  "direct-manipulation",
  "lists",
  "motion",
  "popups",
  "preferences",
  "storage",
  "canvas",
  "text",
]

type CoreExport = {
  name: string
  /** The folder under `packages/core/src/foundation`, `components` or `page` that declares it, like `kernel`. */
  layer: string
  /** `name(first, second?)` for a function, `type Name<T>` for a type. */
  signature: string
  /** Its JSDoc. */
  text: string
  type: boolean
  /** Labeled `@experimental` in its JSDoc, so it may change in any minor release. Everything else is `@stable`. */
  experimental: boolean
  /** An object type's fields, each with its type and JSDoc. */
  members: { name: string; type: string; text: string }[]
}

let cached: CoreExport[] | undefined

/** Every export of `@ui-sdk/core`: functions first, then types, each alphabetical. */
function coreExports() {
  if (cached) {
    return cached
  }
  const file = path.join(coreSource, "index.ts")
  // Resolves `#dev` to the development module, whose exports carry the JSDoc.
  const program = ts.createProgram([file], {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    customConditions: ["development"],
    allowImportingTsExtensions: true,
  })
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(file)!
  cached = checker
    .getExportsOfModule(checker.getSymbolAtLocation(source)!)
    .map((symbol) => {
      const target =
        symbol.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(symbol)
          : symbol
      const declaration = target.declarations?.[0]
      const from = declaration
        ? path
            .relative(coreSource, declaration.getSourceFile().fileName)
            .replace(/^(foundation|components)\//, "")
        : ""
      const isType = !(target.flags & ts.SymbolFlags.Value)
      return {
        name: symbol.name,
        layer: from.includes(path.sep) ? from.split(path.sep)[0] : "kernel",
        signature: isType
          ? typeSignature(symbol.name, declaration)
          : callSignature(symbol.name, target, checker),
        text: ts
          .displayPartsToString(target.getDocumentationComment(checker))
          .replace(/\s+/g, " ")
          .trim(),
        type: isType,
        experimental: target
          .getJsDocTags(checker)
          .some((tag) => tag.name === "experimental"),
        members: isType ? membersOf(target, checker) : [],
      }
    })
    .sort(
      (a, b) => Number(a.type) - Number(b.type) || a.name.localeCompare(b.name)
    )
  return cached
}

// The fields of an object type, like an options type's. None for unions, functions and records.
function membersOf(symbol: ts.Symbol, checker: ts.TypeChecker) {
  const type = checker.getDeclaredTypeOfSymbol(symbol)
  if (
    type.isUnion() ||
    type.getCallSignatures().length ||
    !(type.flags & ts.TypeFlags.Object)
  ) {
    return []
  }
  return checker
    .getPropertiesOfType(type)
    .filter(
      (property) =>
        !property.getJsDocTags(checker).some((tag) => tag.name === "internal")
    )
    .map((property) => {
      const optional = property.flags & ts.SymbolFlags.Optional
      const declared = checker.typeToString(
        checker.getTypeOfSymbol(property),
        undefined,
        ts.TypeFormatFlags.NoTruncation
      )
      return {
        name: `${property.name}${optional ? "?" : ""}`,
        // Without `undefined`, an optional function loses the parentheses the union needed.
        type: optional
          ? declared
              .replace(/ \| undefined$/, "")
              .replace(/^\((\(.*=>.*)\)$/, "$1")
          : declared,
        text: ts
          .displayPartsToString(property.getDocumentationComment(checker))
          .replace(/\s+/g, " ")
          .trim(),
      }
    })
}

// `name(first, second?)`, from the first call signature.
function callSignature(
  name: string,
  symbol: ts.Symbol,
  checker: ts.TypeChecker
) {
  const [signature] = checker.getSignaturesOfType(
    checker.getTypeOfSymbol(symbol),
    ts.SignatureKind.Call
  )
  if (!signature) {
    return name
  }
  const parameters = signature.parameters.map((parameter) => {
    const declaration = parameter.valueDeclaration as
      ts.ParameterDeclaration | undefined
    const optional = declaration?.questionToken || declaration?.initializer
    // A destructured parameter has no name of its own.
    const name =
      declaration && !ts.isIdentifier(declaration.name)
        ? "options"
        : parameter.name
    return `${declaration?.dotDotDotToken ? "..." : ""}${name}${optional ? "?" : ""}`
  })
  return `${name}(${parameters.join(", ")})`
}

// `type Name<A, B>`, without the body.
function typeSignature(name: string, declaration: ts.Declaration | undefined) {
  const parameters =
    declaration &&
    (ts.isTypeAliasDeclaration(declaration) ||
      ts.isInterfaceDeclaration(declaration))
      ? declaration.typeParameters?.map((parameter) => parameter.name.text)
      : undefined
  return `type ${name}${parameters?.length ? `<${parameters.join(", ")}>` : ""}`
}

// `drag-and-drop` reads "Drag and drop".
const layerTitle = (layer: string) =>
  layer[0].toUpperCase() + layer.slice(1).replaceAll("-", " ")

/** The exports of one layer, or with `"other"`, of each layer `coreLayers` doesn't name. */
function exportsByLayer(layer: string) {
  const all = coreExports()
  const layers =
    layer === "other"
      ? [...new Set(all.map((entry) => entry.layer))].filter(
          (name) => !coreLayers.includes(name)
        )
      : [layer]
  return layers.map((name) => ({
    layer: name,
    entries: all.filter((entry) => entry.layer === name),
  }))
}

/** Every entry of `@ui-sdk/core` but `internal` and `renderer`, which are for us, with the docs page that documents it, if one does. */
function coreEntries() {
  const { exports } = JSON.parse(
    readFileSync(path.join(core, "package.json"), "utf8")
  ) as {
    exports: Record<string, string | { default: string }>
  }
  return Object.keys(exports)
    .filter((key) => key !== "./internal/*" && key !== "./renderer")
    .map((key) => {
      const name = key === "." ? "" : key.slice(2)
      // Components and utilities are documented once per framework. React's say where.
      const page = name
        ? (docPage(["react", "components", name]) ??
          docPage(["react", "hooks", name]) ??
          docPage(["core", name]))
        : docPage(["core", "reference"])
      return {
        entry: `@ui-sdk/core${name ? `/${name}` : ""}`,
        page,
        href: page && sharedHref(page.slugs),
        names: page ? [] : valueExports(sourceOf(exports[key])),
      }
    })
}

const sourceOf = (target: string | { default: string }) =>
  typeof target === "string" ? target : target.default

// The values an entry exports, for entries no page documents.
function valueExports(file: string) {
  const resolved = path.join(core, file)
  const program = ts.createProgram([resolved], {
    noEmit: true,
    skipLibCheck: true,
    allowImportingTsExtensions: true,
  })
  const checker = program.getTypeChecker()
  return checker
    .getExportsOfModule(
      checker.getSymbolAtLocation(program.getSourceFile(resolved)!)!
    )
    .filter((symbol) => {
      const target =
        symbol.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(symbol)
          : symbol
      return target.flags & ts.SymbolFlags.Value
    })
    .map((symbol) => symbol.name)
}

export {
  coreEntries,
  type CoreExport,
  coreExports,
  coreLayers,
  exportsByLayer,
  layerTitle,
}
