import { definePrimitive } from "@ui-sdk/core"
import { button } from "@ui-sdk/core/button"
import { checkbox, checkboxGroup } from "@ui-sdk/core/checkbox"
import { nativeHost } from "@ui-sdk/core/native"
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

  test("passes on tabs, controlled or not", () => {
    expect(() => checkCreation(tabs, {})).not.toThrow()
    expect(() =>
      checkCreation(tabs, { value: "a", orientation: "vertical" })
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
