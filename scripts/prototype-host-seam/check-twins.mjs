// PROTOTYPE (issue #14). Checks that each `.native.ts` twin in core exports
// the same names as the module it mirrors. Exits 1 when a pair differs.
//
//   node scripts/prototype-host-seam/check-twins.mjs
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"

const sourceDir = path.resolve(import.meta.dirname, "../../packages/core/src")

// Core lists a file's exports once, in `export { }` blocks at its end.
function exportsOf(file) {
  const names = []
  const text = readFileSync(file, "utf8")
  for (const [, block] of text.matchAll(/^export (?:type )?\{([^}]*)\}/gm)) {
    for (const entry of block.split(",")) {
      const name = entry.trim().replace(/^type\s+/, "")
      if (name) {
        names.push(name.split(/\s+as\s+/).at(-1))
      }
    }
  }
  return names.sort()
}

const twins = readdirSync(sourceDir, { recursive: true }).filter((file) =>
  file.endsWith(".native.ts")
)
let failed = false
for (const twin of twins) {
  const mirrored = twin.replace(/\.native\.ts$/, ".ts")
  if (!existsSync(path.join(sourceDir, mirrored))) {
    console.error(`${twin} mirrors no module.`)
    failed = true
    continue
  }
  const native = exportsOf(path.join(sourceDir, twin))
  const dom = exportsOf(path.join(sourceDir, mirrored))
  const missing = dom.filter((name) => !native.includes(name))
  const extra = native.filter((name) => !dom.includes(name))
  if (missing.length || extra.length) {
    failed = true
    console.error(
      `${twin} differs from ${mirrored}: missing [${missing}], extra [${extra}]`
    )
  } else {
    console.log(`${twin} = ${mirrored}: ${dom.length} exports (${dom})`)
  }
}
console.log(`${twins.length} twins checked.`)
process.exitCode = failed ? 1 : 0
