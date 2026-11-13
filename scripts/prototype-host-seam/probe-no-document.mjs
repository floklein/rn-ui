// PROTOTYPE (issue #14). Instantiates every primitive that an entry of
// `@ui-sdk/core` exports in Node, where `document` is undefined, the way the
// native adapter uses one: make it, keep it, read its api, read each slot's
// declarative fields, deliver each `press`, call `focus()`, destroy it.
// Lists what throws, and where.
//
//   node scripts/prototype-host-seam/probe-no-document.mjs [--native] [--window]
//
// --native  Resolves `.native.ts` twins and registers a host, as Metro does.
// --window  Defines `window` as the global object, as React Native does.
import { build } from "esbuild"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"

const native = process.argv.includes("--native")
const coreDir = path.resolve(import.meta.dirname, "../../packages/core")
const manifest = JSON.parse(
  readFileSync(path.join(coreDir, "package.json"), "utf8")
)
const skipped = ["./internal/*", "./web.css", "./testing"]
const entries = Object.entries(manifest.exports).filter(
  ([key]) => !skipped.includes(key)
)

if (process.argv.includes("--window")) {
  globalThis.window = globalThis
}
if (typeof document !== "undefined") {
  throw new Error("This probe needs an environment with no document.")
}

const outDir = mkdtempSync(path.join(tmpdir(), "probe-no-document-"))
const results = []
const asyncErrors = []
let current = ""
process.on("unhandledRejection", (error) =>
  asyncErrors.push({ during: current, error })
)
process.on("uncaughtException", (error) =>
  asyncErrors.push({ during: current, error })
)

const describe = (error) =>
  `${error?.name ?? "Error"}: ${String(error?.message ?? error).split("\n")[0]}`

function attempt(name, phase, run) {
  try {
    return run()
  } catch (error) {
    results.push({ name, phase, error: describe(error) })
  }
}

for (const [key, target] of entries) {
  const entry = path.join(outDir, `${key.replace(/\W+/g, "_")}.entry.ts`)
  const outfile = entry.replace(/\.entry\.ts$/, ".mjs")
  const source = JSON.stringify(path.join(coreDir, target))
  const from = (file) => JSON.stringify(path.join(coreDir, "src", file))
  writeFileSync(
    entry,
    `export * as entry from ${source}
export { attrs, partState, present, press } from ${from("foundation/kernel/part.ts")}
export { keep } from ${from("foundation/kernel/keep.ts")}
export { setNativeHost } from ${from("foundation/kernel/native-host.ts")}
`
  )
  current = `bundle ${key}`
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "es2022",
    logLevel: "silent",
    conditions: native ? ["react-native"] : [],
    resolveExtensions: native
      ? [".native.ts", ".ts", ".tsx", ".js"]
      : [".ts", ".tsx", ".js"],
  })
  current = `load ${key}`
  let loaded
  try {
    loaded = await import(pathToFileURL(outfile).href)
  } catch (error) {
    results.push({ name: key, phase: "load", error: describe(error) })
    continue
  }
  const { entry: exported, attrs, partState, present, press, keep } = loaded
  if (native) {
    loaded.setNativeHost({ focus() {}, listen: () => () => {} })
  }
  for (const [exportName, primitive] of Object.entries(exported)) {
    if (
      typeof primitive !== "function" ||
      typeof primitive.slots !== "object"
    ) {
      continue
    }
    const name = `${key} ${exportName}`
    current = name
    const instance = attempt(name, "create", () => primitive({ id: "probe" }))
    if (!instance) {
      continue
    }
    attempt(name, "keep", () => keep(instance))
    const api = attempt(name, "api", () => instance.api)
    for (const slot of Object.keys(primitive.slots)) {
      const part = attempt(name, `part ${slot}`, () => instance.part(slot, {}))
      if (!part) {
        continue
      }
      attempt(name, `attrs ${slot}`, () => attrs(part))
      attempt(name, `state ${slot}`, () => partState(part))
      attempt(name, `present ${slot}`, () => present(part))
      attempt(name, `press ${slot}`, () => press(part)?.())
    }
    if (typeof api?.focus === "function") {
      attempt(name, "api.focus()", () => api.focus())
    }
    attempt(name, "destroy", () => instance.destroy())
    results.push({ name, phase: "done" })
  }
}

// Timers and microtasks the probes started, like a pending announcement.
await new Promise((done) => setTimeout(done, 1500))
rmSync(outDir, { recursive: true, force: true })

const probed = results.filter((result) => result.phase === "done")
const thrown = results.filter((result) => result.phase !== "done")
console.log(
  `${entries.length} entries, ${probed.length} primitives probed (${native ? "native twins" : "DOM modules"}${globalThis.window ? ", window defined" : ""}).`
)
for (const { name, phase, error } of thrown) {
  console.log(`THROWS  ${name}  [${phase}]  ${error}`)
}
for (const { during, error } of asyncErrors) {
  console.log(`THROWS LATER  ${during}  ${describe(error)}`)
}
console.log(
  `${thrown.length} synchronous throws, ${asyncErrors.length} asynchronous.`
)
process.exit(0)
