import { describe, expect, test } from "vitest"
import { formatDateRange } from "../src/foundation/date/format.native"
import { firstDayOfWeek } from "../src/foundation/date/week.native"

describe("dates on Hermes, whose Intl has no Locale and no formatRange", () => {
  test("the first day of the week comes from the tag's region", () => {
    expect(firstDayOfWeek("en-US")).toBe(0)
    expect(firstDayOfWeek("de-DE")).toBe(1)
    expect(firstDayOfWeek("ar-EG")).toBe(6)
    expect(firstDayOfWeek("zh-Hant-TW")).toBe(0)
    expect(firstDayOfWeek("en-US-u-fw-mon")).toBe(1)
    expect(firstDayOfWeek("fr")).toBe(1)
  })

  test("a range is its two dates", () => {
    expect(
      formatDateRange("2026-10-01", "2026-11-01", "en-US", {
        month: "long",
        year: "numeric",
      })
    ).toBe("October 2026 – November 2026")
  })
})
