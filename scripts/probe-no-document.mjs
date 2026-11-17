// Creates, keeps, reads, presses, focuses and destroys every primitive with
// no `document`, and lists what throws: `node scripts/probe-no-document.mjs`.
// A throw in a component still pending doesn't fail it.
import { readFileSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import { loadCore } from "./native/core.mjs"

const { values: flags } = parseArgs({
  options: {
    registry: {
      type: "string",
      default: path.resolve(
        import.meta.dirname,
        "../packages/react-native/registry.json"
      ),
    },
  },
})
const pending = new Set(
  JSON.parse(readFileSync(flags.registry, "utf8")).pending
)

if (typeof document !== "undefined") {
  throw new Error("The probe needs an environment with no document.")
}

const { components, renderer, native } = await loadCore()
const { attrs, keep, partState, present, press, unwatched } = renderer
native.setNativeHost({
  focus() {},
  field() {},
  announce() {},
  activate() {},
  compare: () => 0,
  isRTL: () => false,
  box() {},
  follow: () => () => {},
  adjustable: () => () => {},
  scrollNear: () => false,
  screenReader: () => () => {},
  listen: () => () => {},
  seen() {},
})

const describe = (error) =>
  `${error?.name ?? "Error"}: ${String(error?.message ?? error).split("\n")[0]}`

const throws = []
let probed = 0
for (const { name, primitives } of components) {
  for (const [exportName, primitive] of primitives) {
    const attempt = (step, run) => {
      try {
        return run()
      } catch (error) {
        throws.push({ name, path: `${exportName} ${step}`, error })
      }
    }
    const instance = attempt("create", () =>
      unwatched(() => primitive({ id: "probe" }))
    )
    if (!instance) {
      continue
    }
    probed++
    attempt("keep", () => keep(instance))
    const api = attempt("api", () => instance.api)
    for (const slot of Object.keys(primitive.slots)) {
      const part = attempt(`${slot} part`, () => instance.part(slot, {}))
      if (part) {
        attempt(`${slot} attrs`, () => attrs(part))
        attempt(`${slot} state`, () => partState(part))
        attempt(`${slot} present`, () => present(part))
        attempt(`${slot} press`, () => press(part)?.())
      }
    }
    if (typeof api?.focus === "function") {
      attempt("focus()", () => api.focus())
    }
    attempt("destroy", () => instance.destroy())
  }
}

// A missing global is the host's; any other error comes from a part made
// with none of the props it needs, like a calendar day's `value`.
const hostThrows = throws.filter(({ error }) => error instanceof ReferenceError)
const propThrows = throws.filter((entry) => !hostThrows.includes(entry))
let failed = false
for (const { name, path: where, error } of hostThrows) {
  const waiting = pending.has(name)
  failed ||= !waiting
  console.log(
    `${name}${waiting ? " (pending)" : ""}: ${where} throws ${describe(error)}`
  )
}
for (const { name, path: where, error } of propThrows) {
  console.log(`${name}: ${where} needs props: ${describe(error)}`)
}
console.log(
  `${probed} primitives of ${components.length} components probed: ${hostThrows.length} throws, ${propThrows.length} parts that need props.`
)
process.exitCode = failed ? 1 : 0
