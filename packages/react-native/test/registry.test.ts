import { execFileSync, spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

jest.setTimeout(60_000)

const repo = path.join(__dirname, "../../..")
const script = path.join(repo, "scripts/check-native-registry.mjs")
const registry = JSON.parse(
  readFileSync(path.join(__dirname, "../registry.json"), "utf8")
)
const scratch: string[] = []

const run = (args: string[], cwd = repo) =>
  spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" })

function registryFile(change: (copy: typeof registry) => void) {
  const dir = mkdtempSync(path.join(tmpdir(), "native-registry-"))
  scratch.push(dir)
  const copy = structuredClone(registry)
  change(copy)
  const file = path.join(dir, "registry.json")
  writeFileSync(file, JSON.stringify(copy))
  return file
}

afterAll(() => {
  for (const dir of scratch) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("the registry's parity check", () => {
  test("passes with switch and button out of pending and their skipped slots marked", () => {
    const { status, stdout } = run(["parity"])
    expect(stdout).toContain("switch: native entry, 2 slots marked")
    expect(stdout).toContain("button: native entry, 1 slot marked")
    expect(stdout).toContain(`${registry.pending.length} pending:`)
    expect(registry.pending).not.toContain("switch")
    expect(registry.pending).not.toContain("button")
    expect(status).toBe(0)
  })

  test("fails when a component leaves pending with no native entry", () => {
    const file = registryFile((copy) => {
      copy.pending = copy.pending.filter((name: string) => name !== "checkbox")
    })
    const { status, stderr } = run(["parity", "--registry", file])
    expect(stderr).toContain("checkbox has no native entry and isn't pending")
    expect(status).toBe(1)
  })

  test("fails when a component leaves pending with a skipped slot unmarked", () => {
    const file = registryFile((copy) => {
      delete copy.components.switch.slots["switchPrimitive.root"]
    })
    const { status, stderr } = run(["parity", "--registry", file])
    expect(stderr).toContain(
      "switch: switchPrimitive.root declares bind, on, and isn't marked as covered by a file or as needing nothing"
    )
    expect(status).toBe(1)
  })

  test("fails on a slot marked as covered by a file that doesn't exist", () => {
    const file = registryFile((copy) => {
      copy.components.switch.slots["switchPrimitive.root"] = {
        covered: "packages/core/src/components/switch/switch-native.ts",
      }
    })
    const { status, stderr } = run(["parity", "--registry", file])
    expect(stderr).toContain(
      "switch: switchPrimitive.root is covered by packages/core/src/components/switch/switch-native.ts, which doesn't exist"
    )
    expect(status).toBe(1)
  })
})

describe("the registry's edits check", () => {
  test("passes when every edit to an upstream file is recorded", () => {
    const { status, stdout } = run(["edits"])
    expect(stdout).toContain(
      "packages/core/src/foundation/forms/toggle-control.ts"
    )
    expect(status).toBe(0)
  })

  test("fails on an edit to an upstream file the registry doesn't record", () => {
    const file = registryFile((copy) => {
      copy.entries = copy.entries.filter(
        (entry: { file: string }) => entry.file !== "scripts/public-exports.mjs"
      )
    })
    const { status, stderr } = run(["edits", "--registry", file])
    expect(stderr).toContain(
      "scripts/public-exports.mjs differs from upstream and isn't in the registry"
    )
    expect(status).toBe(1)
  })
})

describe("the registry's drift check", () => {
  const git = (cwd: string, ...args: string[]) =>
    execFileSync("git", args, { cwd, encoding: "utf8" }).trim()

  function upstreamRepo() {
    const dir = mkdtempSync(path.join(tmpdir(), "native-drift-"))
    scratch.push(dir)
    git(dir, "init", "-q")
    git(dir, "config", "user.email", "test@example.com")
    git(dir, "config", "user.name", "Test")
    writeFileSync(path.join(dir, "a.ts"), "export const a = 1\n")
    writeFileSync(path.join(dir, "b.ts"), "export const b = 1\n")
    git(dir, "add", ".")
    git(dir, "commit", "-qm", "first")
    const first = git(dir, "rev-parse", "HEAD")
    writeFileSync(path.join(dir, "a.ts"), "export const a = 2\n")
    git(dir, "commit", "-qam", "second")
    return { dir, first, second: git(dir, "rev-parse", "HEAD") }
  }

  function driftRegistry(dir: string, reviewed: string) {
    const file = path.join(dir, "registry.json")
    writeFileSync(
      file,
      JSON.stringify({
        upstream: reviewed,
        entries: [
          { kind: "twin", file: "a.native.ts", mirrors: ["a.ts"], reviewed },
          { kind: "edit", file: "b.ts", mirrors: ["b.ts"], reviewed },
        ],
      })
    )
    return file
  }

  test("lists a mirrored file that changed since its recorded commit", () => {
    const { dir, first, second } = upstreamRepo()
    const file = driftRegistry(dir, first)
    const { status, stdout } = run(
      ["drift", "--registry", file, "--upstream", second],
      dir
    )
    expect(stdout).toContain("a.ts changed since")
    expect(stdout).toContain("a.native.ts")
    expect(stdout).not.toContain("b.ts changed")
    expect(status).toBe(1)
  })

  test("lists nothing when no mirrored file changed", () => {
    const { dir, second } = upstreamRepo()
    const file = driftRegistry(dir, second)
    const { status, stdout } = run(
      ["drift", "--registry", file, "--upstream", second],
      dir
    )
    expect(stdout).not.toContain("changed since")
    expect(stdout).toContain("No mirrored file changed")
    expect(status).toBe(0)
  })
})
