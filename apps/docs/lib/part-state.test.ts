import { expect, test } from "vitest"
import { pageMarkdown } from "./page-markdown"
import { docPage } from "./pages"
import { partStateRows } from "./part-state"

// Each test builds a TypeScript program for the state type, which takes seconds.

const switchFile = "../../packages/core/src/components/switch/switch.ts"

test("lists each field a part's style functions receive, with its type and meaning", () => {
  const rows = partStateRows({
    component: "switch",
    part: "thumb",
    path: switchFile,
    name: "SwitchThumbState",
  })
  expect(rows.map((row) => [row.name, row.type])).toEqual([
    ["checked", "boolean"],
    ["disabled", "boolean"],
    ["readOnly", "boolean"],
    ["required", "boolean"],
  ])
  expect(rows.every((row) => row.text.length > 0)).toBe(true)
}, 30_000)

test("Switch's native Markdown page lists each part's state and shows the native example", async () => {
  const page = docPage(["react-native", "components", "switch"])!
  const markdown = await pageMarkdown(page.file, "react-native", () => null)
  expect(markdown).toContain(
    'import { Switch, SwitchThumb } from "@rn-ui-sdk/react-native/switch"'
  )
  expect(markdown).toMatch(/### SwitchThumb\n+- `checked` \(`boolean`\): \S/)
  expect(markdown).not.toContain("<PartStateTable")
}, 30_000)
