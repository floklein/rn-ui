import type { Page } from "@playwright/test"
import { expect, lastAction, shortcutKeys, test } from "../fixtures"
import { dialogFixture } from "../fixtures/dialog"
import { composingEscape } from "../fixtures/popup"

// Behavior past the WAI-ARIA pattern, tagged `@enhancement`.

const dialog = (page: Page) =>
  page.getByRole("dialog", { name: "Profile settings" })
const nested = (page: Page) =>
  page.getByRole("dialog", { name: "Advanced settings" })
const trigger = (page: Page) =>
  page.getByRole("button", { name: "Edit profile" })
const field = (page: Page) =>
  page.getByRole("textbox", { name: "Display name" })
const alert = (page: Page) =>
  page.getByRole("alertdialog", { name: "Delete project?" })
const outside = (page: Page, text: string) =>
  page.locator("button", { hasText: new RegExp(`^${text}$`) })

// What the fixture's onOpenChange callbacks reported, as "dialog:false:escape-key".
const changes = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __openChanges?: string[] }).__openChanges ?? []
  )

async function openWithKeyboard(page: Page) {
  await trigger(page).focus()
  await page.keyboard.press("Enter")
  await expect(field(page)).toBeFocused()
}

test.describe(
  "Escape that closes exactly one thing",
  { tag: "@enhancement" },
  () => {
    test("Escape while an input method is composing text keeps the dialog open", async ({
      page,
      open,
    }) => {
      await open("dialog")
      await openWithKeyboard(page)
      await composingEscape(page)
      await page.waitForTimeout(100)
      await expect(dialog(page)).toBeVisible()
      await page.keyboard.press("Escape")
      await expect(dialog(page)).toBeHidden()
    })

    test("Escape closes a non-modal dialog only while focus is inside it", async ({
      page,
      open,
    }) => {
      await open("dialog", { modal: "false" })
      await openWithKeyboard(page)
      await page.getByRole("button", { name: "After" }).focus()
      await page.keyboard.press("Escape")
      await page.waitForTimeout(100)
      await expect(dialog(page)).toBeVisible()
      await field(page).focus()
      await page.keyboard.press("Escape")
      await expect(dialog(page)).toBeHidden()
    })
  }
)

test.describe(
  "focus that always lands somewhere useful",
  { tag: "@enhancement" },
  () => {
    test("closing returns focus to the trigger before the exit animation finishes", async ({
      page,
      open,
    }) => {
      await open("dialog", { animate: "" })
      await page.addStyleTag({
        content:
          ".dialog, .dialog-backdrop { transition-duration: 2s !important }",
      })
      await openWithKeyboard(page)
      await expect
        .poll(() =>
          dialog(page).evaluate(
            (el) =>
              !el.hasAttribute("data-starting-style") &&
              !el.getAnimations().length
          )
        )
        .toBe(true)
      await page.keyboard.press("Escape")
      await expect(page.locator(".dialog[data-ending-style]")).toHaveCount(1)
      await expect(trigger(page)).toBeFocused()
      await expect(page.locator(".dialog[data-ending-style]")).toHaveCount(1)
    })

    test("closing after the trigger is gone moves focus to the element after where it was", async ({
      page,
      open,
    }) => {
      await open("dialog", { removable: "" })
      await openWithKeyboard(page)
      await page.getByRole("button", { name: "Remove trigger" }).click()
      await expect(trigger(page)).toHaveCount(0)
      await page.keyboard.press("Escape")
      await expect(dialog(page)).toBeHidden()
      await expect(
        page.getByRole("button", { name: "Delete project" })
      ).toBeFocused()
    })

    test("closing after the trigger is gone skips past a later positive tabindex", async ({
      page,
      open,
    }) => {
      await open("dialog", { removable: "" })
      await trigger(page).evaluate((el) =>
        el.parentElement!.insertAdjacentHTML(
          "beforeend",
          `<button type="button" tabindex="1">Help</button>`
        )
      )
      await openWithKeyboard(page)
      await page.getByRole("button", { name: "Remove trigger" }).click()
      await page.keyboard.press("Escape")
      await expect(dialog(page)).toBeHidden()
      await expect(
        page.getByRole("button", { name: "Delete project" })
      ).toBeFocused()
    })

    test("a dialog open from the start moves focus inside", async ({
      page,
      open,
    }) => {
      await open("dialog", { open: "" })
      await expect(field(page)).toBeFocused()
      await page.keyboard.press("Escape")
      await expect(dialog(page)).toBeHidden()
      await expect(trigger(page)).toBeFocused()
    })

    test("with initial focus on the content, the dialog itself takes focus", async ({
      page,
      open,
    }) => {
      await open("dialog", { initialFocus: "content" })
      await trigger(page).click()
      await expect(dialog(page)).toBeFocused()
    })
  }
)

test.describe(
  "the outside is inert, except what must stay live",
  { tag: "@enhancement" },
  () => {
    test("the page outside is inert while open and restored exactly after", async ({
      page,
      open,
    }) => {
      await open("dialog")
      const style = await page.evaluate(
        () => document.documentElement.style.cssText
      )
      const inert = () =>
        outside(page, "Before").evaluate((el) => !!el.closest("[inert]"))
      await trigger(page).click()
      await expect(dialog(page)).toBeVisible()
      expect(await inert()).toBe(true)
      // The trigger is inert too: nothing outside a modal dialog may be used.
      expect(
        await outside(page, "Edit profile").evaluate(
          (el) => !!el.closest("[inert]")
        )
      ).toBe(true)
      await page.keyboard.press("Escape")
      await expect(dialog(page)).toBeHidden()
      expect(await inert()).toBe(false)
      expect(
        await page.evaluate(() => document.documentElement.style.cssText)
      ).toBe(style)
    })

    test("a live region outside the dialog keeps announcing while it's open", async ({
      page,
      open,
    }) => {
      await open("dialog")
      await trigger(page).click()
      await page.getByRole("button", { name: "Save" }).click()
      expect(await lastAction(page)).toBe("save")
      expect(
        await page.locator("output").evaluate((el) => !!el.closest("[inert]"))
      ).toBe(false)
    })
  }
)

test.describe(
  "non-modal dialogs that behave like the APG",
  { tag: "@enhancement" },
  () => {
    test("Tab leaves a non-modal dialog and the dialog stays open", async ({
      page,
      open,
      tab,
    }) => {
      await open("dialog", { modal: "false" })
      await openWithKeyboard(page)
      await page.getByRole("button", { name: "Close" }).focus()
      await tab()
      await expect(page.locator(":focus")).not.toHaveCount(0)
      expect(
        await page.evaluate(
          () => !!document.activeElement?.closest('[role="dialog"]')
        )
      ).toBe(false)
      await expect(dialog(page)).toBeVisible()
    })
    test("a non-modal dialog stays open when the page is clicked", async ({
      page,
      open,
    }) => {
      await open("dialog", { modal: "false", backdrop: "none" })
      await trigger(page).click()
      await expect(dialog(page)).toBeVisible()
      await page.getByRole("button", { name: "After" }).click()
      await page.waitForTimeout(100)
      await expect(dialog(page)).toBeVisible()
    })
  }
)

test.describe("nested and stacked", { tag: "@enhancement" }, () => {
  test("a dialog opened inside a dialog marks both, for styling", async ({
    page,
    open,
  }) => {
    await open("dialog", { nested: "" })
    await trigger(page).click()
    await page.getByRole("button", { name: "Advanced" }).click()
    await expect(nested(page)).toBeVisible()
    await expect(dialog(page)).toHaveAttribute("data-nested-open", "")
    await expect(dialog(page)).not.toHaveAttribute("data-nested")
    await expect(nested(page)).toHaveAttribute("data-nested", "")
    expect(
      await dialog(page).evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--dialog-stack")
      )
    ).toBe("1")
    // Every backdrop renders, and the nested one says so.
    await expect(page.locator(".dialog-backdrop:visible")).toHaveCount(2)
    await expect(
      page.locator(".dialog-backdrop[data-nested]:visible")
    ).toHaveCount(1)
    await page.keyboard.press("Escape")
    await expect(nested(page)).toBeHidden()
    await expect(dialog(page)).not.toHaveAttribute("data-nested-open")
  })

  test("closing the parent closes the nested dialog with reason parent-close", async ({
    page,
    open,
  }) => {
    await open("dialog", { nested: "" })
    await openWithKeyboard(page)
    await page.getByRole("button", { name: "Advanced" }).click()
    await expect(nested(page)).toBeVisible()
    await page.evaluate(() =>
      (window as unknown as { dialog: { close: () => void } }).dialog.close()
    )
    await expect(page.getByRole("dialog")).toHaveCount(0)
    expect(await changes(page)).toContain("nested:false:parent-close")
    await expect(trigger(page)).toBeFocused()
  })
})

test.describe("opening from anywhere", { tag: "@enhancement" }, () => {
  test("a controller opens the dialog, moves focus in, and resolves with how it closed", async ({
    page,
    open,
  }) => {
    await open("dialog")
    await page.getByRole("button", { name: "Open with controller" }).focus()
    const result = page.evaluate(() =>
      (
        window as unknown as {
          dialog: { open: () => Promise<{ reason: string }> }
        }
      ).dialog.open()
    )
    await expect(field(page)).toBeFocused()
    await page.keyboard.press("Escape")
    expect(await result).toEqual({ reason: "escape-key", source: "keyboard" })
    await expect(
      page.getByRole("button", { name: "Open with controller" })
    ).toBeFocused()
  })

  test("aborting the signal closes the dialog, and the promise resolves once", async ({
    page,
    open,
  }) => {
    await open("dialog")
    const result = await page.evaluate(async () => {
      const dialog = (
        window as unknown as {
          dialog: { open: (o: object) => Promise<object> }
        }
      ).dialog
      const abort = new AbortController()
      const pending = dialog.open({ signal: abort.signal })
      await new Promise((frame) => requestAnimationFrame(frame))
      abort.abort()
      return pending
    })
    expect(result).toEqual({ reason: "imperative", source: "programmatic" })
    await expect(page.getByRole("dialog")).toHaveCount(0)
  })

  test("a pending open() resolves with reason unmount when the dialog leaves the page", async ({
    page,
    open,
    framework,
  }) => {
    test.skip(
      framework !== "web" && framework !== "web-portal",
      "Removing the element is how a web component leaves."
    )
    await open("dialog")
    const result = await page.evaluate(async () => {
      const el = document.querySelector("ui-dialog") as HTMLElement & {
        api: { open: () => Promise<object> }
      }
      const pending = el.api.open()
      // Moving the element within one task keeps it, like a portal does.
      const parent = el.parentElement!
      const next = el.nextSibling
      document.body.append(el)
      parent.insertBefore(el, next)
      // The element decides it's gone in a microtask, so one task later it has.
      await new Promise((task) => setTimeout(task))
      const moved = await Promise.race([
        pending.then(() => "settled"),
        Promise.resolve("pending"),
      ])
      el.remove()
      return { moved, result: await pending }
    })
    expect(result).toEqual({
      moved: "pending",
      result: { reason: "unmount", source: "programmatic" },
    })
  })

  test("a form with method dialog closes the dialog and reports the submitter's value", async ({
    page,
    open,
  }) => {
    await open("dialog", { form: "" })
    await openWithKeyboard(page)
    await page.getByRole("button", { name: "Archive" }).click()
    await expect(dialog(page)).toBeHidden()
    expect(await lastAction(page)).toBe("archive")
    await expect(trigger(page)).toBeFocused()
  })

  test("a confirm helper resolves true for the action and false otherwise", async ({
    page,
    open,
  }) => {
    await open("dialog")
    const confirm = () =>
      page.evaluate(() =>
        (
          window as unknown as { confirmDelete: () => Promise<boolean> }
        ).confirmDelete()
      )
    let answer = confirm()
    await expect(alert(page)).toBeVisible()
    await page.getByRole("button", { name: "Delete", exact: true }).click()
    expect(await answer).toBe(true)
    answer = confirm()
    await expect(alert(page)).toBeVisible()
    await page.getByRole("button", { name: "Cancel" }).click()
    expect(await answer).toBe(false)
    answer = confirm()
    await expect(alert(page)).toBeVisible()
    await page.keyboard.press("Escape")
    expect(await answer).toBe(false)
  })

  test("a confirm opened from inside a modal dialog takes focus and stays usable", async ({
    page,
    open,
  }) => {
    await open("dialog")
    await openWithKeyboard(page)
    const answer = page.evaluate(() =>
      (
        window as unknown as { confirmDelete: () => Promise<boolean> }
      ).confirmDelete()
    )
    await expect(alert(page)).toBeVisible()
    await expect(
      alert(page).getByRole("button", { name: "Cancel" })
    ).toBeFocused()
    await alert(page)
      .getByRole("button", { name: "Delete", exact: true })
      .click()
    expect(await answer).toBe(true)
    await expect(dialog(page)).toBeVisible()
    await expect(field(page)).toBeFocused()
  })

  test("a confirm opened over a modal dialog with nothing focused stays usable", async ({
    page,
    open,
  }) => {
    await open("dialog")
    await openWithKeyboard(page)
    const answer = page.evaluate(() => {
      ;(document.activeElement as HTMLElement).blur()
      return (
        window as unknown as { confirmDelete: () => Promise<boolean> }
      ).confirmDelete()
    })
    await expect(
      alert(page).getByRole("button", { name: "Cancel" })
    ).toBeFocused()
    await alert(page)
      .getByRole("button", { name: "Delete", exact: true })
      .click()
    expect(await answer).toBe(true)
    await expect(dialog(page)).toBeVisible()
    await field(page).focus()
    await expect(field(page)).toBeFocused()
  })

  test("a confirm opened as a modal dialog shows, before the page freezes, stays usable", async ({
    page,
    open,
  }) => {
    await open("dialog")
    const answer = page.evaluate(async () => {
      const target = window as unknown as {
        dialog: { open: () => void }
        confirmDelete: () => Promise<boolean>
      }
      target.dialog.open()
      await new Promise<void>((resolve) => {
        const shown = () => document.querySelector('[role="dialog"][data-open]')
        if (shown()) {
          resolve()
          return
        }
        const observer = new MutationObserver(() => {
          if (shown()) {
            observer.disconnect()
            resolve()
          }
        })
        observer.observe(document.body, {
          subtree: true,
          childList: true,
          attributes: true,
        })
      })
      return target.confirmDelete()
    })
    await expect(
      alert(page).getByRole("button", { name: "Cancel" })
    ).toBeFocused()
    await alert(page)
      .getByRole("button", { name: "Delete", exact: true })
      .click()
    expect(await answer).toBe(true)
    await expect(dialog(page)).toBeVisible()
    await field(page).focus()
    await expect(field(page)).toBeFocused()
  })

  test("closing reports why, for every way a dialog closes", async ({
    page,
    open,
  }) => {
    await open("dialog")
    await trigger(page).click()
    await page.keyboard.press("Escape")
    await trigger(page).click()
    await page.mouse.click(5, 5)
    await trigger(page).click()
    await page.getByRole("button", { name: "Close" }).click()
    expect(
      (await changes(page)).filter((change) =>
        change.startsWith("dialog:false")
      )
    ).toEqual([
      "dialog:false:escape-key",
      "dialog:false:outside-press",
      "dialog:false:close-press",
    ])
  })
})

test.describe("shortcuts", { tag: "@enhancement" }, () => {
  const quickEdit = (page: Page) =>
    page.getByRole("button", {
      name: dialogFixture.shortcut.trigger,
      exact: true,
    })

  test("a trigger connected through a controller shows its shortcut in a Shortcut part, and binds it", async ({
    page,
    open,
  }) => {
    await open("dialog", { shortcut: "" })
    const { aria, text } = await shortcutKeys(page, "E")
    await expect(quickEdit(page)).toHaveAttribute("aria-keyshortcuts", aria)
    const hint = quickEdit(page).locator("[data-slot=dialog-shortcut]")
    await expect(hint).toHaveAttribute("aria-hidden", "true")
    await expect(hint).toHaveText(text)
    await page.keyboard.press("ControlOrMeta+e")
    await expect(dialog(page)).toBeVisible()
  })
})

test.describe("web components", () => {
  test.beforeEach(({ framework }) => {
    test.skip(!framework.startsWith("web"), "Web component markup only.")
  })

  test(
    "the open property and attribute open and close the dialog",
    { tag: "@enhancement" },
    async ({ page, open }) => {
      await open("dialog")
      await page.evaluate(
        () =>
          ((
            document.querySelector("ui-dialog") as HTMLElement & {
              open: boolean
            }
          ).open = true)
      )
      await expect(dialog(page)).toBeVisible()
      await expect(field(page)).toBeFocused()
      await page.evaluate(
        () =>
          ((
            document.querySelector("ui-dialog") as HTMLElement & {
              open: boolean
            }
          ).open = false)
      )
      await expect(dialog(page)).toBeHidden()
    }
  )
})
