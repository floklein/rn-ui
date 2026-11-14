import assert from "node:assert/strict"
import { byTestId, isChecked, label, role, roles, spec } from "./session.ts"

spec(
  "switch",
  "a press checks the switch in the platform tree",
  async ({ driver, saveTree }) => {
    const control = driver.$(byTestId("switch-uncontrolled"))
    await control.waitForExist({ timeout: 20_000 })
    await saveTree("before")
    assert.equal(await role(control), roles.switch)
    assert.equal(await label(control), "uncontrolled")
    assert.equal(await isChecked(control), false)

    await control.click()

    await driver.waitUntil(() => isChecked(control), { timeout: 5_000 })
    await saveTree("after")
    assert.equal(await role(control), roles.switch)

    const disabled = driver.$(byTestId("switch-disabled"))
    assert.equal(await isChecked(disabled), true)
    assert.equal(await disabled.isEnabled(), false)
  }
)
