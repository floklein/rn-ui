// Checks that each twin in core exports the names of the module it mirrors,
// and exits 1 when a pair differs: `node scripts/check-twins.mjs [dir]`. Its
// types are checked by `Twin`, under `pnpm typecheck`.
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"

const sourceDir = path.resolve(
  process.argv[2] ?? path.join(import.meta.dirname, "../packages/core/src")
)

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

const twins = readdirSync(sourceDir, { recursive: true })
  .filter((file) => file.endsWith(".native.ts"))
  .sort()
let failed = false
for (const twin of twins) {
  const mirrored = twin.replace(/\.native\.ts$/, ".ts")
  if (!existsSync(path.join(sourceDir, mirrored))) {
    console.error(`${twin} mirrors no module: there is no ${mirrored}.`)
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
      `${twin} differs from ${mirrored}: missing [${missing.join(", ")}], extra [${extra.join(", ")}]`
    )
  } else {
    console.log(`${twin} = ${mirrored}: ${dom.join(", ")}`)
  }
}
console.log(`${twins.length} twins checked.`)
process.exitCode = failed ? 1 : 0
