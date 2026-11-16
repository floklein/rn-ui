import { definePrimitive } from "@ui-sdk/core"
import { avatar } from "@ui-sdk/core/avatar"
import { button } from "@ui-sdk/core/button"
import { checkbox, checkboxGroup } from "@ui-sdk/core/checkbox"
import { collapsible } from "@ui-sdk/core/collapsible"
import { input, inputGroup, textarea } from "@ui-sdk/core/input"
import { meter } from "@ui-sdk/core/meter"
import { nativeHost } from "@ui-sdk/core/native"
import { pagination } from "@ui-sdk/core/pagination"
import { progress } from "@ui-sdk/core/progress"
import { passwordInput } from "@ui-sdk/core/password-input"
import { radioGroup } from "@ui-sdk/core/radio"
import { rating } from "@ui-sdk/core/rating"
import { separator } from "@ui-sdk/core/separator"
import { switchPrimitive } from "@ui-sdk/core/switch"
import { tabs } from "@ui-sdk/core/tabs"
import { toggle, toggleGroup } from "@ui-sdk/core/toggle"
import { checkCreation } from "../src/testing"

describe("checkCreation", () => {
  test("passes on a switch, whose creation and parts read no host API", () => {
    expect(() => checkCreation(switchPrimitive, {})).not.toThrow()
  })

  test("passes on a button, enabled or disabled", () => {
    expect(() => checkCreation(button, {})).not.toThrow()
    expect(() =>
      checkCreation(button, { disabled: true, focusableWhenDisabled: true })
    ).not.toThrow()
  })

  test("passes on an avatar", () => {
    expect(() => checkCreation(avatar, {})).not.toThrow()
  })

  test("passes on a progress bar, determinate or not, and a meter", () => {
    expect(() => checkCreation(progress, { value: 40 })).not.toThrow()
    expect(() => checkCreation(progress, { value: null })).not.toThrow()
    expect(() =>
      checkCreation(meter, { value: 3, min: -10, max: 10, locale: "de-DE" })
    ).not.toThrow()
  })

  test("passes on a separator, decorative or vertical", () => {
    expect(() => checkCreation(separator, {})).not.toThrow()
    expect(() =>
      checkCreation(separator, { orientation: "vertical", decorative: true })
    ).not.toThrow()
  })

  test("passes on a pagination, by page count or by total", () => {
    expect(() =>
      checkCreation(pagination, { pageCount: 10, defaultPage: 4 })
    ).not.toThrow()
    expect(() =>
      checkCreation(pagination, { total: 95, pageSize: 20, siblings: 2 })
    ).not.toThrow()
  })

  test("passes on an input, a textarea and an input group", () => {
    expect(() => checkCreation(input, { defaultValue: "Lisbon" })).not.toThrow()
    expect(() => checkCreation(textarea, { autoResize: true })).not.toThrow()
    expect(() => checkCreation(inputGroup, {})).not.toThrow()
  })

  test("passes on a password input, hidden or shown", () => {
    expect(() => checkCreation(passwordInput, {})).not.toThrow()
    expect(() =>
      checkCreation(passwordInput, { defaultVisible: true, disabled: true })
    ).not.toThrow()
  })

  test("passes on a checkbox and a checkbox group", () => {
    expect(() => checkCreation(checkbox, {})).not.toThrow()
    expect(() =>
      checkCreation(checkbox, { checked: "indeterminate", disabled: true })
    ).not.toThrow()
    expect(() => checkCreation(checkboxGroup, {})).not.toThrow()
  })

  test("passes on a toggle and a toggle group, enabled or disabled", () => {
    expect(() => checkCreation(toggle, {})).not.toThrow()
    expect(() => checkCreation(toggle, { disabled: true })).not.toThrow()
    expect(() => checkCreation(toggleGroup, { multiple: true })).not.toThrow()
    expect(() => checkCreation(toggleGroup, { disabled: true })).not.toThrow()
  })

  test("passes on a radio group, checked, read-only or disabled", () => {
    expect(() => checkCreation(radioGroup, {})).not.toThrow()
    expect(() =>
      checkCreation(radioGroup, { defaultValue: "small", readOnly: true })
    ).not.toThrow()
    expect(() => checkCreation(radioGroup, { disabled: true })).not.toThrow()
  })

  test("passes on a rating, read-only or with half stars", () => {
    expect(() => checkCreation(rating, { defaultValue: 3 })).not.toThrow()
    expect(() =>
      checkCreation(rating, { readOnly: true, defaultValue: 4.2 })
    ).not.toThrow()
    expect(() => checkCreation(rating, { step: 0.5 })).not.toThrow()
  })

  test("passes on tabs, controlled or not", () => {
    expect(() => checkCreation(tabs, {})).not.toThrow()
    expect(() =>
      checkCreation(tabs, { value: "a", orientation: "vertical" })
    ).not.toThrow()
  })

  test("passes on a collapsible, open or closed", () => {
    expect(() => checkCreation(collapsible, {})).not.toThrow()
    expect(() =>
      checkCreation(collapsible, { open: true, disabled: true })
    ).not.toThrow()
  })

  test("fails on a primitive that reads the document as it's created", () => {
    const measured = definePrimitive({
      name: "measured",
      state: () => ({
        width: (globalThis as { document?: Document }).document?.body,
      }),
      api: () => ({}),
      slots: (slot) => ({ root: slot({ attrs: () => ({}) }) }),
    })
    expect(() => checkCreation(measured, {})).toThrow(
      "creating it reads `document`"
    )
  })

  test("fails on a part that asks the native host while it renders", () => {
    const eager = definePrimitive({
      name: "eager",
      state: () => ({}),
      api: (context) => ({
        focus: () => nativeHost()?.focus([...context.parts()][0]),
      }),
      slots: (slot) => ({
        root: slot({
          attrs: (_, { api }) => {
            api.focus()
            return {}
          },
        }),
      }),
    })
    expect(() => checkCreation(eager, {})).toThrow(
      "`root` asks the native host to focus"
    )
  })
})
