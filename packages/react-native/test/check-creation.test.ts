import { definePrimitive } from "@ui-sdk/core"
import { avatar } from "@ui-sdk/core/avatar"
import { button } from "@ui-sdk/core/button"
import { checkbox, checkboxGroup } from "@ui-sdk/core/checkbox"
import { input, inputGroup, textarea } from "@ui-sdk/core/input"
import { nativeHost } from "@ui-sdk/core/native"
import { rating } from "@ui-sdk/core/rating"
import { switchPrimitive } from "@ui-sdk/core/switch"
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

  test("passes on an input, a textarea and an input group", () => {
    expect(() => checkCreation(input, { defaultValue: "Lisbon" })).not.toThrow()
    expect(() => checkCreation(textarea, { autoResize: true })).not.toThrow()
    expect(() => checkCreation(inputGroup, {})).not.toThrow()
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

  test("passes on a rating, read-only or with half stars", () => {
    expect(() => checkCreation(rating, { defaultValue: 3 })).not.toThrow()
    expect(() =>
      checkCreation(rating, { readOnly: true, defaultValue: 4.2 })
    ).not.toThrow()
    expect(() => checkCreation(rating, { step: 0.5 })).not.toThrow()
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
