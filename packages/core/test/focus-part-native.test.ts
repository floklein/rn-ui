import { afterEach, describe, expect, test, vi } from "vitest"
import { switchPrimitive } from "../src/components/switch/switch"
import { setNativeHost } from "../src/foundation/kernel/native-host"

// What Metro and the native build resolve in its place.
vi.mock(
  "../src/foundation/focus/focus-part",
  () => import("../src/foundation/focus/focus-part.native")
)

afterEach(() => setNativeHost(undefined))

describe("focusing a part on the native host", () => {
  test("a switch's controller focus asks the host to focus its root part", () => {
    const focus = vi.fn()
    setNativeHost({ focus, field: vi.fn(), announce: vi.fn() })
    const instance = switchPrimitive({ id: "s" })
    const root = instance.part("root", {}, true)
    instance.api.focus()
    expect(focus).toHaveBeenCalledExactlyOnceWith(root)
  })

  test("a switch's controller focus asks nothing with no host", () => {
    const instance = switchPrimitive({ id: "s" })
    instance.part("root", {}, true)
    expect(() => instance.api.focus()).not.toThrow()
  })
})
