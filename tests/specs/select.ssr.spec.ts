import type { Page } from "@playwright/test"
import { expect, test } from "../fixtures"

// Only *-ssr projects render on the server first.
test.beforeEach(({ framework }) => {
  test.skip(!framework.endsWith("-ssr"), "Only for server-rendered fixtures.")
})

const hydrationErrors = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __hydrationErrors: string[] }).__hydrationErrors
  )

// The text of the first element matching `selector` in the HTML the server sent, before hydration.
const serverText = (page: Page, selector: string) =>
  page.evaluate((selector) => {
    const template = document.createElement("template")
    template.innerHTML = (
      window as unknown as { __serverHtml: string }
    ).__serverHtml
    return template.content.querySelector(selector)?.textContent ?? null
  }, selector)

// The element the first label in the server's HTML points at, as a selector.
const serverLabelTarget = (page: Page) =>
  page.evaluate(() => {
    const template = document.createElement("template")
    template.innerHTML = (
      window as unknown as { __serverHtml: string }
    ).__serverHtml
    const id = template.content.querySelector("label")?.htmlFor
    const target = id ? template.content.getElementById(id) : null
    return target ? `${target.localName}.${target.className}` : null
  })

test("a closed select hydrates without mismatches", async ({ page, open }) => {
  await open("select", { value: "banana" })
  await page.getByRole("combobox", { name: "Fruit" }).click()
  await expect(page.getByRole("listbox")).toBeVisible()
  expect(await hydrationErrors(page)).toEqual([])
})

test("an open select hydrates without mismatches", async ({ page, open }) => {
  await open("select", { open: "" })
  await expect(page.getByRole("listbox")).toBeVisible()
  expect(await hydrationErrors(page)).toEqual([])
})

test("the server markup submits the default value before hydration", async ({
  page,
  framework,
  open,
}) => {
  test.skip(
    !framework.startsWith("react"),
    "React's fixture records the server markup."
  )
  await open("select", { value: "banana" })
  const value = await page.evaluate(
    () =>
      (window as unknown as { __serverForm?: string }).__serverForm ?? "missing"
  )
  expect(value).toContain("fruit=banana")
})

for (const [items, options] of [
  ["composed items", {}],
  ["items as data", { data: "" }],
] as const) {
  test(`the server markup shows the selected item's label, with ${items}`, async ({
    page,
    open,
    framework,
  }) => {
    // A snippet can't be read before it renders, unlike a Vue slot or React children.
    test.skip(
      framework.startsWith("svelte") && items === "composed items",
      "Svelte roots can't read their items' labels before they mount."
    )
    // Solid has no element tree to walk before the items render, unlike React children or a Vue slot.
    test.skip(
      framework.startsWith("solid") && items === "composed items",
      "Solid roots can't read their items' labels before they mount; `items` or `itemToLabel` give the server the label."
    )
    await open("select", { value: "banana", ...options })
    expect(await serverText(page, '[data-slot="select-value"]')).toBe("Banana")
    await expect(page.locator('[data-slot="select-value"]')).toHaveText(
      "Banana"
    )
    expect(await hydrationErrors(page)).toEqual([])
  })
}

test("a field's label points at a trigger outside its select in the server markup", async ({
  page,
  open,
}) => {
  await open("select", { field: "" })
  expect(await serverLabelTarget(page)).toBe("button.trigger")
  const trigger = page.getByRole("combobox", { name: "Fruit", exact: true })
  await expect(trigger).toBeVisible()
  await expect(page.locator("label")).toHaveAttribute(
    "for",
    (await trigger.getAttribute("id"))!
  )
  expect(await hydrationErrors(page)).toEqual([])
})
