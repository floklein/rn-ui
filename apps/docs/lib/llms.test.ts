import { expect, test } from "vitest"
import { frameworkLlms } from "./llms"

const link = ({ slugs }: { slugs: string[] }) => `/docs/${slugs.join("/")}`

test("React Native's llms.txt indexes Switch with its native import", async () => {
  const text = await frameworkLlms("react-native", link)
  expect(text).toContain("# ui-sdk for React Native")
  expect(text).toContain(
    "- [Switch](/docs/react-native/components/switch): Turn a setting on or off. Import from `@ui-sdk/react-native/switch`."
  )
  expect(text).toContain("## Installation")
})
