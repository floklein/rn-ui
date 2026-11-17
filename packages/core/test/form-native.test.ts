import { afterEach, describe, expect, test, vi } from "vitest"
import * as form from "../src/foundation/forms/form.native"
import { nativeElement } from "../src/foundation/kernel/native-element"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import type { Part } from "../src/foundation/kernel/primitive-types"

afterEach(() => setNativeHost(undefined))

// An element that fails the test when anything reads or calls it.
const untouchable = () =>
  new Proxy({} as HTMLInputElement, {
    get(_target, name) {
      throw new Error(`read ${String(name)}`)
    },
  })

const part = { slot: "root", key: "", id: "c" } as Part

describe("the form twin", () => {
  test("form participation touches no element and reports nothing", () => {
    const el = untouchable()
    const options = {
      reset: vi.fn(),
      disabled: vi.fn(),
      focus: vi.fn(),
      checked: () => true,
      value: () => "on",
      subscribe: () => () => {},
    }
    form.bindHiddenInput(el, options)()
    form.bindValueInput(el, options)()
    form.associate(el, { ...options, write: vi.fn() })()
    form.bindInternals(el, options as never)()
    form.attachFormInternals(el, {} as ElementInternals, vi.fn())
    form.dispatchChange(el)
    form.submitImplicitly({} as HTMLFormElement)
    form.setComponentValidity(el, "Not a date")
    form.validityChanged(el)
    form.onValidityChange(vi.fn())()
    form.labelledBy(el, () => [])()
    form.nameFromLabels(el)()
    form.watchFieldsets(el, options.disabled)()
    form.watchFormDisabled(el, { set: options.disabled })()
    form.elementMoved(el)
    expect(form.formInternals(el)).toBeUndefined()
    expect(form.labelsOf(el)).toEqual([])
    expect(form.isLabelable(el)).toBe(false)
    expect(form.fieldsetDisabled(el)).toBe(false)
    expect(form.valueMissingMessage("text")).toBe("")
    expect(options.disabled).not.toHaveBeenCalled()
    expect(options.reset).not.toHaveBeenCalled()
  })

  test("the disabled checks read a control's own state", () => {
    expect(form.isDisabled({ disabled: false, formDisabled: true })).toBe(true)
    expect(form.isDisabled({ disabled: false, formDisabled: false })).toBe(
      false
    )
  })

  test("focus registration reaches the host's focus", () => {
    const focus = vi.fn()
    setNativeHost({
      focus,
      field: vi.fn(),
      announce: vi.fn(),
      activate: vi.fn(),
      listen: vi.fn(),
      compare: vi.fn(),
      isRTL: () => false,
      box: vi.fn(),
      follow: vi.fn(),
      adjustable: vi.fn(),
      scrollNear: vi.fn(),
      seen: vi.fn(),
    })
    const el = nativeElement(part)
    form.claimInvalidFocus(el, null)
    expect(focus).toHaveBeenCalledExactlyOnceWith(part)
    expect(form.invalidFocusClaimed(el, null)).toBe(true)

    const group = nativeElement({ ...part, slot: "group" })
    const first = vi.fn()
    const unfocus = form.focusWith(group, first)
    form.claimInvalidFocus(group, {} as HTMLFormElement)
    expect(first).toHaveBeenCalledOnce()
    unfocus()
  })
})
