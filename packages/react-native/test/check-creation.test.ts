import { definePrimitive } from "@ui-sdk/core"
import { accordion } from "@ui-sdk/core/accordion"
import { avatar } from "@ui-sdk/core/avatar"
import { button } from "@ui-sdk/core/button"
import { checkbox, checkboxGroup } from "@ui-sdk/core/checkbox"
import { collapsible } from "@ui-sdk/core/collapsible"
import { alertDialog, dialog } from "@ui-sdk/core/dialog"
import { drawer } from "@ui-sdk/core/drawer"
import { popover } from "@ui-sdk/core/popover"
import { input, inputGroup, textarea } from "@ui-sdk/core/input"
import { label } from "@ui-sdk/core/label"
import { meter } from "@ui-sdk/core/meter"
import { nativeHost } from "@ui-sdk/core/native"
import { otpInput } from "@ui-sdk/core/otp-input"
import { pagination } from "@ui-sdk/core/pagination"
import { calendar } from "@ui-sdk/core/calendar"
import { progress } from "@ui-sdk/core/progress"
import { passwordInput } from "@ui-sdk/core/password-input"
import { radioGroup } from "@ui-sdk/core/radio"
import { rating } from "@ui-sdk/core/rating"
import { segmentedControl } from "@ui-sdk/core/segmented-control"
import { separator } from "@ui-sdk/core/separator"
import { slider } from "@ui-sdk/core/slider"
import { switchPrimitive } from "@ui-sdk/core/switch"
import { tabs } from "@ui-sdk/core/tabs"
import { toggle, toggleGroup } from "@ui-sdk/core/toggle"
import { toolbar } from "@ui-sdk/core/toolbar"
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

  test("passes on a toolbar, horizontal or vertical and disabled", () => {
    expect(() => checkCreation(toolbar, {})).not.toThrow()
    expect(() =>
      checkCreation(toolbar, { orientation: "vertical", disabled: true })
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

  test("passes on a label", () => {
    expect(() => checkCreation(label, {})).not.toThrow()
  })

  test("passes on a slider, single or a range", () => {
    expect(() => checkCreation(slider, { defaultValue: 40 })).not.toThrow()
    expect(() =>
      checkCreation(slider, { defaultValue: [20, 80], locale: "de-DE" })
    ).not.toThrow()
  })

  test("passes on a separator, decorative or vertical", () => {
    expect(() => checkCreation(separator, {})).not.toThrow()
    expect(() =>
      checkCreation(separator, { orientation: "vertical", decorative: true })
    ).not.toThrow()
  })

  test("passes on a calendar, one date, a range, two months or disabled", () => {
    const props = { day: { value: "2026-10-16" }, weekday: { index: 0 } }
    expect(() =>
      checkCreation(calendar, { defaultValue: "2026-10-16" }, props)
    ).not.toThrow()
    expect(() =>
      checkCreation(
        calendar,
        {
          mode: "range",
          defaultValue: ["2026-10-12", "2026-10-14"],
          months: 2,
          locale: "de-DE",
        },
        props
      )
    ).not.toThrow()
    expect(() =>
      checkCreation(calendar, { disabled: true }, props)
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

  test("passes on an otp input, empty, full or disabled", () => {
    expect(() => checkCreation(otpInput, {})).not.toThrow()
    expect(() =>
      checkCreation(otpInput, { defaultValue: "123456", disabled: true })
    ).not.toThrow()
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

  test("passes on a segmented control, checked, read-only, vertical or disabled", () => {
    expect(() => checkCreation(segmentedControl, {})).not.toThrow()
    expect(() =>
      checkCreation(segmentedControl, { defaultValue: "list", readOnly: true })
    ).not.toThrow()
    expect(() =>
      checkCreation(segmentedControl, { orientation: "vertical" })
    ).not.toThrow()
    expect(() =>
      checkCreation(segmentedControl, { disabled: true })
    ).not.toThrow()
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

  test("passes on an accordion, with items open or none", () => {
    expect(() => checkCreation(accordion, {})).not.toThrow()
    expect(() =>
      checkCreation(accordion, {
        defaultValue: ["shipping", "returns"],
        multiple: true,
        disabled: true,
      })
    ).not.toThrow()
  })

  test("passes on a collapsible, open or closed", () => {
    expect(() => checkCreation(collapsible, {})).not.toThrow()
    expect(() =>
      checkCreation(collapsible, { open: true, disabled: true })
    ).not.toThrow()
  })

  test("passes on a drawer, open or closed", () => {
    expect(() => checkCreation(drawer, {})).not.toThrow()
    expect(() => checkCreation(drawer, { open: true })).not.toThrow()
  })

  test("passes on a popover, open or closed, modal or not", () => {
    expect(() => checkCreation(popover, {})).not.toThrow()
    expect(() =>
      checkCreation(popover, { defaultOpen: true, modal: true })
    ).not.toThrow()
  })

  test("passes on a dialog and an alert dialog, open or closed", () => {
    expect(() => checkCreation(dialog, {})).not.toThrow()
    expect(() => checkCreation(dialog, { open: true })).not.toThrow()
    expect(() =>
      checkCreation(alertDialog, { defaultOpen: true })
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
