// Checks each component out of the native registry's `pending` list has every
// example the other frameworks have, or an exemption naming its web-only
// feature: `node scripts/check-native-examples.mjs [--registry <file>]`.
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"

const root = path.resolve(import.meta.dirname, "..")
const { values: flags } = parseArgs({
  options: {
    registry: {
      type: "string",
      default: path.join(root, "packages/react-native/registry.json"),
    },
  },
})
const registry = JSON.parse(readFileSync(flags.registry, "utf8"))
const examplesDir = path.join(root, "examples/components")
const frameworks = ["react", "solid", "svelte", "vue", "web"]
let failed = false

const fail = (message) => {
  failed = true
  console.error(message)
}

function examplesOf(component, framework) {
  const dir = path.join(examplesDir, component, framework)
  if (!existsSync(dir)) {
    return []
  }
  return readdirSync(dir).map((file) => file.replace(/\.\w+$/, ""))
}

for (const { component, example, feature, reason } of registry.exemptions) {
  if (!feature || !reason) {
    fail(
      `The exemption of ${component}'s ${example} example names no feature and reason.`
    )
  }
}

for (const component of Object.keys(registry.components)) {
  const native = new Set(examplesOf(component, "react-native"))
  const exempt = new Set(
    registry.exemptions
      .filter((exemption) => exemption.component === component)
      .map((exemption) => exemption.example)
  )
  const elsewhere = new Map()
  for (const framework of frameworks) {
    for (const example of examplesOf(component, framework)) {
      elsewhere.set(example, [...(elsewhere.get(example) ?? []), framework])
    }
  }
  for (const [example, found] of elsewhere) {
    if (!native.has(example) && !exempt.has(example)) {
      fail(
        `${component}: ${example} exists for ${found.join(", ")} but not for native, and isn't exempt.`
      )
    }
  }
  for (const example of exempt) {
    if (native.has(example)) {
      fail(`${component}: ${example} is exempt but has a native example.`)
    }
  }
  console.log(
    `${component}: ${native.size} native examples, ${exempt.size} exempt`
  )
}
process.exitCode = failed ? 1 : 0
