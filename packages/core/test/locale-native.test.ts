import { afterEach, describe, expect, test, vi } from "vitest"
import {
  bindPageLocale,
  localeOf,
  pageLocale,
  toLocale,
  userLocale,
} from "../src/foundation/text/locale.native"

afterEach(() => vi.restoreAllMocks())

// Intl as Hermes builds it, reporting the device's language.
function device(locale: string) {
  const format = new Intl.DateTimeFormat(locale)
  vi.spyOn(Intl, "DateTimeFormat").mockReturnValue(format)
}

describe("the locale on the native host", () => {
  test("the user's and the page's locale are the device's, as Intl reports it", () => {
    device("fr-FR")
    expect(userLocale()).toBe("fr-FR")
    expect(pageLocale()).toBe("fr-FR")
    expect(pageLocale({} as Element)).toBe("fr-FR")
  })

  test("a mounted part reads the device's locale at once", () => {
    device("de-DE")
    const set = vi.fn()
    bindPageLocale({} as Element, set)
    expect(set).toHaveBeenCalledExactlyOnceWith("de-DE")
  })

  test("a component's own locale wins over the device's", () => {
    expect(localeOf({ locale: "ja-JP", pageLocale: "de-DE" })).toBe("ja-JP")
    expect(localeOf({ pageLocale: "de-DE" })).toBe("de-DE")
    expect(localeOf({})).toBe("en-US")
  })

  test("tags read as on the web", () => {
    expect(toLocale("de_DE.UTF-8@euro")).toBe("de-DE")
    expect(toLocale("not a locale!")).toBeUndefined()
  })
})
