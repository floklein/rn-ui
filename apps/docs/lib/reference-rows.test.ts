import { expect, test } from "vitest"
import { typeRows } from "./reference-rows"

// Each test builds a TypeScript program for the type, which takes seconds.

const core = "../../packages/core/src/components"

const rowsOf = async (
  path: string,
  name: string,
  framework: "react" | "react-native"
) =>
  (await typeRows({ path: `${core}/${path}`, name, framework })).flatMap(
    (table) => table.rows
  )

test("native option tables leave out the web-only names the native types don't take", async () => {
  const names = (rows: { name: string }[]) => rows.map((row) => row.name)
  const web = names(await rowsOf("switch/switch.ts", "SwitchOptions", "react"))
  const native = names(
    await rowsOf("switch/switch.ts", "SwitchOptions", "react-native")
  )
  expect(web).toEqual(expect.arrayContaining(["name?", "form?"]))
  expect(native).toEqual(
    web.filter((name) => !["name?", "form?"].includes(name))
  )
}, 60_000)

test("native option tables leave out modal's trap-focus value and the container", async () => {
  const rows = await rowsOf("dialog/dialog.ts", "DialogOptions", "react-native")
  expect(rows.find((row) => row.name === "modal?")?.type).toBe("boolean")
  expect(rows.some((row) => row.name === "container?")).toBe(false)
}, 60_000)
