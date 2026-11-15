// Loads core's component entries from source in Node, bundled once, with
// what renders a part beside them.
import { build } from "esbuild"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"

const coreDir = path.resolve(import.meta.dirname, "../../packages/core")
const skippedHooks = ["bind", "on", "connect", "asleep"]

function componentEntries() {
  const manifest = JSON.parse(
    readFileSync(path.join(coreDir, "package.json"), "utf8")
  )
  return Object.entries(manifest.exports)
    .filter(
      ([, target]) =>
        typeof target === "string" && target.includes("/components/")
    )
    .map(([key, target]) => ({ name: key.slice(2), target }))
}

const isPrimitive = (value) =>
  typeof value === "function" && typeof value.slots === "object"

async function loadCore() {
  const entries = componentEntries()
  const outDir = mkdtempSync(path.join(tmpdir(), "ui-sdk-core-"))
  const entry = path.join(outDir, "entry.ts")
  const source = (file) => JSON.stringify(path.join(coreDir, file))
  writeFileSync(
    entry,
    [
      ...entries.map(
        ({ target }, index) => `export * as e${index} from ${source(target)}`
      ),
      `export * as renderer from ${source("src/renderer.ts")}`,
      `export * as native from ${source("src/native.ts")}`,
    ].join("\n")
  )
  const outfile = path.join(outDir, "core.mjs")
  try {
    await build({
      entryPoints: [entry],
      outfile,
      bundle: true,
      format: "esm",
      platform: "neutral",
      target: "es2022",
      logLevel: "silent",
      conditions: ["development"],
    })
    const loaded = await import(pathToFileURL(outfile).href)
    return {
      components: entries.map(({ name }, index) => ({
        name,
        primitives: Object.entries(loaded[`e${index}`]).filter(([, value]) =>
          isPrimitive(value)
        ),
      })),
      renderer: loaded.renderer,
      native: loaded.native,
    }
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
}

/** The slots of a primitive that declare a hook the native adapter never calls, with those hooks. */
const skippedSlots = (primitive) =>
  Object.entries(primitive.slots)
    .map(([slot, spec]) => ({
      slot,
      hooks: skippedHooks.filter((hook) => spec[hook] !== undefined),
    }))
    .filter(({ hooks }) => hooks.length)

export { loadCore, skippedSlots }
