import { describe, expect, test, vi } from "vitest"
import { meter } from "../src/components/meter/meter"
import { progress } from "../src/components/progress/progress"
import { gaugeNative } from "../src/foundation/gauge/gauge-native"
import { attrs } from "../src/foundation/kernel/part"

// A locale twin that reads the device's language, as Intl reports it.
vi.mock(import("../src/foundation/text/locale"), async (original) => ({
  ...(await original()),
  bindPageLocale: (_, set) => set("de-DE"),
}))

describe.each([
  ["progress", () => progress({ id: "bar", value: 40 })],
  ["meter", () => meter({ id: "bar", value: 40 })],
])("gaugeNative on %s", (_, create) => {
  test("a mounted label names the root, until it unmounts", () => {
    const instance = create()
    const root = instance.part("root", {}, true)
    const leave = gaugeNative.label!(instance.part("label", {}, true))
    expect(attrs(root)["aria-labelledby"]).toBe("bar-label")
    leave!()
    expect(attrs(root)["aria-labelledby"]).toBeUndefined()
  })

  test("the mounted root formats in the locale the host reports", () => {
    const instance = create()
    const root = instance.part("root", {}, true)
    expect(attrs(root)["aria-valuetext"]).toBe("40%")
    gaugeNative.root!(root)
    expect(attrs(root)["aria-valuetext"]).toBe("40\u00a0%")
  })
})
