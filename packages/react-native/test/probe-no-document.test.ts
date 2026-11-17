import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

jest.setTimeout(60_000)

const repo = path.join(__dirname, "../../..")
const probe = (args: string[] = []) =>
  spawnSync(
    process.execPath,
    [path.join(repo, "scripts/probe-no-document.mjs"), ...args],
    { encoding: "utf8" }
  )

describe("the no-document probe", () => {
  test("lists the press throws of core as native resolves it, each against its component, and none for switch, input, password input, field, otp input, number input or autocomplete", () => {
    const { status, stdout } = probe()
    const throws = stdout
      .split("\n")
      .filter((line) => line.includes(" throws "))
      .map((line) => line.replace(/ throws .*/, ""))
    expect(throws).toEqual([
      "combobox (pending): combobox label press",
      "tree (pending): tree item press",
    ])
    expect(stdout).not.toMatch(/^switch/m)
    expect(stdout).not.toMatch(/^input/m)
    expect(stdout).not.toMatch(/^password-input/m)
    expect(stdout).not.toMatch(/^otp-input/m)
    expect(stdout).not.toMatch(/^number-input/m)
    expect(stdout).not.toMatch(/^autocomplete.* throws /m)
    expect(stdout).not.toMatch(/^field/m)
    expect(status).toBe(0)
  })

  test("fails on a throw in a component that isn't pending", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "native-probe-"))
    const registry = JSON.parse(
      readFileSync(path.join(__dirname, "../registry.json"), "utf8")
    )
    registry.pending = registry.pending.filter(
      (name: string) => name !== "tree"
    )
    const file = path.join(dir, "registry.json")
    writeFileSync(file, JSON.stringify(registry))
    const { status, stdout } = probe(["--registry", file])
    rmSync(dir, { recursive: true, force: true })
    expect(stdout).toContain(
      "tree: tree item press throws ReferenceError: HTMLElement is not defined"
    )
    expect(status).toBe(1)
  })
})
