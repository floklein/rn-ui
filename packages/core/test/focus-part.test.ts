// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest"
import { switchPrimitive } from "../src/components/switch/switch"
import { focusPart } from "../src/foundation/focus/focus-part"
import { focusPart as focusPartNative } from "../src/foundation/focus/focus-part.native"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import { bind } from "../src/foundation/kernel/part"

afterEach(() => setNativeHost(undefined))

describe("focusing a part", () => {
  test("on the DOM host, it focuses the part's element", () => {
    const button = document.createElement("button")
    document.body.append(button)
    focusPart(
      () => button,
      () => [],
      "root"
    )
    expect(document.activeElement).toBe(button)
    button.remove()
  })

  test("on the native host, it asks the host to focus the part of the slot", () => {
    const focus = vi.fn()
    setNativeHost({
      focus,
      field: vi.fn(),
      announce: vi.fn(),
      activate: vi.fn(),
      listen: vi.fn(),
      compare: vi.fn(),
    })
    const instance = switchPrimitive({ id: "s" })
    const root = instance.part("root")
    const thumb = instance.part("thumb")
    focusPartNative(
      () => undefined,
      () => [thumb, root],
      "root"
    )
    expect(focus).toHaveBeenCalledExactlyOnceWith(root)
  })

  test("on the native host, it picks the part with the key when the slot has several", () => {
    const focus = vi.fn()
    setNativeHost({
      focus,
      field: vi.fn(),
      announce: vi.fn(),
      activate: vi.fn(),
      listen: vi.fn(),
      compare: vi.fn(),
    })
    const instance = switchPrimitive({ id: "s" })
    const first = instance.part("root", { id: "first" })
    const second = instance.part("root", { id: "second" })
    focusPartNative(
      () => undefined,
      () => [first, second],
      "root",
      "second"
    )
    expect(focus).toHaveBeenCalledExactlyOnceWith(second)
  })

  test("on the native host, it asks nothing when the slot has no part", () => {
    const focus = vi.fn()
    setNativeHost({
      focus,
      field: vi.fn(),
      announce: vi.fn(),
      activate: vi.fn(),
      listen: vi.fn(),
      compare: vi.fn(),
    })
    const instance = switchPrimitive({ id: "s" })
    focusPartNative(
      () => undefined,
      () => [instance.part("thumb")],
      "root"
    )
    expect(focus).not.toHaveBeenCalled()
  })

  test("a switch's controller focus goes through it", () => {
    const button = document.createElement("button")
    document.body.append(button)
    const instance = switchPrimitive({ id: "s" })
    const unbind = bind(instance.part("root"), button)
    instance.api.focus()
    expect(document.activeElement).toBe(button)
    unbind()
    button.remove()
  })
})
