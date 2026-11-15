import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"

/**
 * Builds `dist/native`, with each twin in the place of its module, and lists
 * the published entries that have no `react-native` condition.
 */
function buildNative({ packageDir, outDir }) {
  const nativeDir = path.join(outDir, "native")
  const modules = readdirSync(outDir, { recursive: true }).filter((file) =>
    file.endsWith(".js")
  )
  for (const file of modules) {
    const target = path.join(nativeDir, file.replace(/\.native\.js$/, ".js"))
    mkdirSync(path.dirname(target), { recursive: true })
    if (file.endsWith(".native.js")) {
      renameSync(path.join(outDir, file), target)
      rmSync(path.join(outDir, file.replace(/\.js$/, ".d.ts")), { force: true })
    } else if (!modules.includes(file.replace(/\.js$/, ".native.js"))) {
      cpSync(path.join(outDir, file), target)
    }
  }
  const { publishConfig } = JSON.parse(
    readFileSync(path.join(packageDir, "package.json"), "utf8")
  )
  for (const target of Object.values(publishConfig.imports)) {
    if (target["react-native"]?.development) {
      writeGuard(packageDir, target)
    }
  }
  return [
    ...missingConditions(publishConfig.exports, "exports"),
    ...missingConditions(publishConfig.imports, "imports"),
  ]
}

// Metro folds `__DEV__` in a release bundle before it collects requires, so
// the development module leaves the bundle with the branch that needs it.
function writeGuard(packageDir, { "react-native": native, default: dom }) {
  const guard = path.join(packageDir, native.default.default)
  const relative = (target) =>
    `./${path.relative(path.dirname(guard), path.join(packageDir, target))}`
  const development = relative(native.development.default)
  const stub = relative(dom.default.replace(/^\.\/dist\//, "./dist/native/"))
  const names = exportedNames(path.join(path.dirname(guard), stub))
  writeFileSync(
    guard,
    `const host = __DEV__ ? require("${development}") : require("${stub}")\n` +
      `export const { ${names.join(", ")} } = host\n`
  )
}

function exportedNames(file) {
  const [, block = ""] = /export\s*\{([^}]*)\}/.exec(readFileSync(file, "utf8"))
  return block
    .split(",")
    .map((entry) =>
      entry
        .trim()
        .split(/\s+as\s+/)
        .at(-1)
    )
    .filter(Boolean)
}

function missingConditions(map, field) {
  return Object.entries(map)
    .filter(
      ([, target]) =>
        publishesModule(target) &&
        (typeof target === "string" || !("react-native" in target))
    )
    .map(
      ([key]) =>
        `publishConfig.${field}["${key}"] has no "react-native" condition.`
    )
}

function publishesModule(target) {
  return typeof target === "string"
    ? target.endsWith(".js")
    : Object.values(target).some(publishesModule)
}

export { buildNative }
