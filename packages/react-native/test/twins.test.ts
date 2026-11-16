import { spawnSync } from "node:child_process"
import path from "node:path"

const script = path.join(__dirname, "../../../scripts/check-twins.mjs")
const check = (dir?: string) =>
  spawnSync(process.execPath, dir ? [script, dir] : [script], {
    encoding: "utf8",
  })
const fixture = (name: string) => path.join(__dirname, "fixtures/twins", name)

describe("the twin check", () => {
  test("passes on core, where each twin exports its module's names", () => {
    const { status, stdout } = check()
    expect(stdout).toContain(
      "focus-part.native.ts = foundation/focus/focus-part.ts"
    )
    expect(stdout).toContain(
      "announce.native.ts = foundation/platform/announce.ts"
    )
    expect(status).toBe(0)
  })

  test("fails on a twin with a missing export", () => {
    const { status, stderr } = check(fixture("missing"))
    expect(stderr).toContain("missing [clearAnnouncements]")
    expect(status).toBe(1)
  })

  test("fails on a twin with an extra export", () => {
    const { status, stderr } = check(fixture("extra"))
    expect(stderr).toContain("extra [nativeOnly]")
    expect(status).toBe(1)
  })

  test("fails on a twin with no module beside it", () => {
    const { status, stderr } = check(fixture("orphan"))
    expect(stderr).toContain("mirrors no module")
    expect(status).toBe(1)
  })
})
