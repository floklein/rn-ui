// Checks the native registry, packages/react-native/registry.json: its
// `edits`, `parity` and `drift` commands, and what each checks, are in
// contributing/upstream.md. With no command, it runs edits and parity.
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import { loadCore, skippedSlots } from "./native/core.mjs"

const root = path.resolve(import.meta.dirname, "..")
const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    registry: {
      type: "string",
      default: path.join(root, "packages/react-native/registry.json"),
    },
    upstream: { type: "string", default: "upstream/main" },
  },
})
const registry = JSON.parse(readFileSync(flags.registry, "utf8"))
let failed = false

const fail = (message) => {
  failed = true
  console.error(message)
}

const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", stdio: "pipe" }).trim()

// A shallow clone, like CI's, may lack the recorded commit.
function ensureCommit(commit) {
  try {
    git("cat-file", "-e", `${commit}^{commit}`)
  } catch {
    git("fetch", "--quiet", "--no-tags", "--depth=1", "origin", commit)
  }
}

function checkEdits() {
  ensureCommit(registry.upstream)
  const recorded = new Set(registry.entries.map((entry) => entry.file))
  const changed = git(
    "diff",
    "--name-only",
    "--diff-filter=MDT",
    registry.upstream
  )
    .split("\n")
    .filter(Boolean)
  for (const file of changed) {
    if (recorded.has(file)) {
      console.log(`${file}: recorded`)
    } else {
      fail(`${file} differs from upstream and isn't in the registry.`)
    }
  }
  for (const entry of registry.entries) {
    if (!existsSync(path.join(root, entry.file))) {
      fail(`${entry.file} is in the registry but doesn't exist.`)
    }
  }
}

function checkComponent(name, primitives) {
  const native = registry.components?.[name]
  if (!native || !existsSync(path.join(root, native.entry))) {
    fail(`${name} has no native entry and isn't pending.`)
    return
  }
  let marked = 0
  for (const [exportName, primitive] of primitives) {
    for (const { slot, hooks } of skippedSlots(primitive)) {
      const key = `${exportName}.${slot}`
      const mark = native.slots?.[key]
      if (mark?.covered) {
        if (existsSync(path.join(root, mark.covered))) {
          marked++
        } else {
          fail(
            `${name}: ${key} is covered by ${mark.covered}, which doesn't exist.`
          )
        }
      } else if (mark?.needs === "nothing" && mark.reason) {
        marked++
      } else {
        fail(
          `${name}: ${key} declares ${hooks.join(", ")}, and isn't marked as covered by a file or as needing nothing, with a reason.`
        )
      }
    }
  }
  console.log(
    `${name}: native entry, ${marked} slot${marked === 1 ? "" : "s"} marked`
  )
}

async function checkParity() {
  const { components } = await loadCore()
  const pending = new Set(registry.pending)
  const names = new Set(components.map(({ name }) => name))
  for (const name of pending) {
    if (!names.has(name)) {
      fail(`${name} is pending but core exports no such component.`)
    } else if (registry.components?.[name]) {
      fail(`${name} has a native entry and is still pending.`)
    }
  }
  for (const { name, primitives } of components) {
    if (!pending.has(name)) {
      checkComponent(name, primitives)
    }
  }
  console.log(`${pending.size} pending: ${[...pending].join(", ")}`)
}

function checkDrift() {
  const changed = new Map()
  for (const entry of registry.entries) {
    ensureCommit(entry.reviewed)
    for (const file of entry.mirrors) {
      const diff = git(
        "diff",
        "--name-only",
        entry.reviewed,
        flags.upstream,
        "--",
        file
      )
      if (diff) {
        const by = changed.get(file) ?? { since: entry.reviewed, files: [] }
        by.files.push(entry.file)
        changed.set(file, by)
      }
    }
  }
  for (const [file, { since, files }] of changed) {
    console.log(
      `${file} changed since ${since.slice(0, 8)}: review ${files.join(", ")}`
    )
  }
  if (changed.size) {
    failed = true
  } else {
    console.log(`No mirrored file changed up to ${flags.upstream}.`)
  }
}

const [command] = positionals
if (command === "drift") {
  checkDrift()
} else {
  if (!command || command === "edits") {
    checkEdits()
  }
  if (!command || command === "parity") {
    await checkParity()
  }
}
process.exitCode = failed ? 1 : 0
