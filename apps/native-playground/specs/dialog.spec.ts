import assert from "node:assert/strict"
import {
  byTestId,
  byText,
  isHeading,
  platform,
  role,
  roles,
  spec,
} from "./session.ts"

spec(
  "dialog",
  "the dialog opens, exposes its parts and is dismissed",
  async ({ driver, saveTree }) => {
    const tab = driver.$(byTestId("tab-Dialog"))
    await tab.waitForExist({ timeout: 20_000 })
    await tab.click()
    const trigger = driver.$(byTestId("dialog-trigger"))
    const content = driver.$(byTestId("dialog-content"))
    await trigger.waitForExist({ timeout: 5_000 })
    await saveTree("before")
    assert.equal(await role(trigger), roles.button)
    assert.equal(await content.isExisting(), false)

    await trigger.click()

    await content.waitForExist({ timeout: 5_000 })
    await saveTree("open")
    assert.equal(await isHeading(content.$(byText("Delete project"))), true)
    assert.equal(
      await content.$(byText("This can't be undone.")).isExisting(),
      true
    )
    const close = content.$(byTestId("close-cancel"))
    assert.equal(await role(close), roles.button)

    if (platform === "android") {
      await driver.back()
    } else {
      await close.click()
    }

    await content.waitForExist({ timeout: 5_000, reverse: true })
    await saveTree("after")
    assert.equal(await trigger.isExisting(), true)
  }
)
