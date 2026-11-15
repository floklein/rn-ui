import { expect } from "@playwright/test"
import { test } from "./docs-test"
import { readdirSync } from "node:fs"
import path from "node:path"

const content = path.join(import.meta.dirname, "../../apps/docs/content/docs")
const nativePages = readdirSync(path.join(content, "react-native"), {
  recursive: true,
  encoding: "utf8",
})
  .filter((file) => file.endsWith(".mdx"))
  .map((file) =>
    path.posix.join("/docs/react-native", file.replace(/(\/?index)?\.mdx$/, ""))
  )

for (const url of nativePages) {
  test(`${url} names the packages the fork publishes`, async ({ page }) => {
    await page.goto(url)
    await expect(page.locator("main")).not.toContainText("@ui-sdk/")
  })
}

test("the native install commands and imports use the published names", async ({
  page,
}) => {
  for (const url of [
    "/docs/react-native/installation",
    "/docs/react-native/components/switch",
  ]) {
    await page.goto(url)
    const main = page.locator("main")
    await expect(main).toContainText(
      "npm install @rn-ui-sdk/react-native @rn-ui-sdk/core"
    )
    await expect(main).toContainText('from "@rn-ui-sdk/react-native/switch"')
  }
})

test("a React page keeps upstream's package names", async ({ page }) => {
  await page.goto("/docs/react/installation")
  await expect(page.locator("main")).toContainText("@ui-sdk/react")
  await expect(page.locator("main")).not.toContainText("@rn-ui-sdk/")
})
