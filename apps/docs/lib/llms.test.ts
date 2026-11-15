import { expect, test } from "vitest"
import { frameworkLlms } from "./llms"

// It builds a TypeScript program for every reference table, which takes seconds.
const link = ({ slugs }: { slugs: string[] }) => `/docs/${slugs.join("/")}`

test("React Native's llms.txt indexes Switch with its published import", async () => {
  const text = await frameworkLlms("react-native", link)
  expect(text).toContain("# ui-sdk for React Native")
  expect(text).toContain(
    "- [Switch](/docs/react-native/components/switch): Turn a setting on or off. Import from `@rn-ui-sdk/react-native/switch`."
  )
  expect(text).not.toContain("@ui-sdk/")
  expect(text).toContain("## Installation")
}, 30_000)
