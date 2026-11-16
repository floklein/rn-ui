import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

jest.setTimeout(60_000)

const repo = path.join(__dirname, "../../..")
const registry = JSON.parse(
  readFileSync(path.join(__dirname, "../registry.json"), "utf8")
)
const scratch = mkdtempSync(path.join(tmpdir(), "native-examples-"))

function check(change?: (copy: typeof registry) => void) {
  const args = [path.join(repo, "scripts/check-native-examples.mjs")]
  if (change) {
    const copy = structuredClone(registry)
    change(copy)
    const file = path.join(scratch, "registry.json")
    writeFileSync(file, JSON.stringify(copy))
    args.push("--registry", file)
  }
  return spawnSync(process.execPath, args, { encoding: "utf8" })
}

const withoutExemption = (example: string) => (copy: typeof registry) => {
  copy.exemptions = copy.exemptions.filter(
    (exemption: { example: string }) => exemption.example !== example
  )
}

afterAll(() => rmSync(scratch, { recursive: true, force: true }))

describe("the native example check", () => {
  test("passes with every example of switch written for native or exempt", () => {
    const { status, stdout } = check()
    expect(stdout).toContain("switch: 9 native examples, 3 exempt")
    expect(status).toBe(0)
  })

  test("fails when a component out of pending misses an example with no exemption", () => {
    const { status, stderr } = check(withoutExemption("form"))
    expect(stderr).toContain(
      "switch: form exists for react, solid, svelte, vue, web but not for native, and isn't exempt."
    )
    expect(status).toBe(1)
  })

  test("doesn't hold a pending component to its examples", () => {
    const { status, stdout } = check()
    expect(stdout).not.toMatch(/^waterfall/m)
    expect(status).toBe(0)
  })

  test("fails on an exemption with no feature", () => {
    const { status, stderr } = check((copy) => {
      copy.exemptions[0].feature = ""
    })
    expect(stderr).toContain(
      "The exemption of switch's form example names no feature and reason."
    )
    expect(status).toBe(1)
  })

  test("fails on an exemption with no reason", () => {
    const { status, stderr } = check((copy) => {
      delete copy.exemptions[0].reason
    })
    expect(stderr).toContain(
      "The exemption of switch's form example names no feature and reason."
    )
    expect(status).toBe(1)
  })
})
