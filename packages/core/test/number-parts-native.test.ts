import { afterAll, beforeAll, describe, expect, test, vi } from "vitest"
import { numberParts } from "../src/foundation/number/number-parts.native"
import { isPartialNumber, parseNumber } from "../src/foundation/number/parse"

vi.mock(
  "../src/foundation/number/number-parts",
  () => import("../src/foundation/number/number-parts.native")
)

const { formatToParts } = Intl.NumberFormat.prototype
beforeAll(() => {
  // @ts-expect-error Hermes on iOS has none.
  delete Intl.NumberFormat.prototype.formatToParts
})
afterAll(() => {
  Intl.NumberFormat.prototype.formatToParts = formatToParts
})

describe("number parts on Hermes", () => {
  test("splits the number's digits and separators from the text around it", () => {
    const parts = (locale: string, options: Intl.NumberFormatOptions = {}) =>
      numberParts(new Intl.NumberFormat(locale, options), -12345.6)
        .map((part) => `${part.type}:${part.value}`)
        .join(" ")
    expect(parts("en-US")).toBe(
      "minusSign:- integer:12 group:, integer:345 decimal:. fraction:6"
    )
    expect(parts("de-DE", { style: "currency", currency: "EUR" })).toBe(
      "minusSign:- integer:12 group:. integer:345 decimal:, fraction:60 literal:\u00a0€"
    )
    expect(parts("en-US", { maximumFractionDigits: 0 })).toBe(
      "minusSign:- integer:12 group:, integer:346"
    )
  })
})

describe("parsing on Hermes, which has no formatToParts", () => {
  test("reads plain and grouped numbers", () => {
    expect(parseNumber("1234.5", "en-US")).toBe(1234.5)
    expect(parseNumber("1,234.5", "en-US")).toBe(1234.5)
    expect(parseNumber("-.5", "en-US")).toBe(-0.5)
    expect(parseNumber("", "en-US")).toBe(null)
    expect(parseNumber("abc", "en-US")).toBe(null)
    expect(parseNumber("1.2.3", "en-US")).toBe(null)
  })

  test("reads the locale's separators", () => {
    expect(parseNumber("1.234,5", "de-DE")).toBe(1234.5)
    expect(parseNumber("1 234,5", "fr-FR")).toBe(1234.5)
    expect(parseNumber("1 234,5", "fr-FR")).toBe(1234.5)
    expect(parseNumber("1’234.5", "de-CH")).toBe(1234.5)
  })

  test("reads the locale's decimal separator in formats that show no decimals", () => {
    expect(parseNumber("12,5 %", "de-DE", { style: "percent" })).toBe(0.125)
    expect(parseNumber("1,5", "de-DE", { maximumFractionDigits: 0 })).toBe(1.5)
    expect(parseNumber("1,5", "de-DE", { useGrouping: false })).toBe(1.5)
  })

  test("reads accounting negatives in parentheses", () => {
    const accounting = {
      style: "currency",
      currency: "USD",
      currencySign: "accounting",
    } as const
    expect(parseNumber("($1,234.56)", "en-US", accounting)).toBe(-1234.56)
    expect(isPartialNumber("($1", "en-US", accounting)).toBe(true)
  })

  test("reads a point as the decimal where it doesn't group", () => {
    expect(parseNumber("12.5", "fr-FR")).toBe(12.5)
  })

  test("reads the locale's digits and minus signs", () => {
    expect(parseNumber("١٢٣", "ar-EG")).toBe(123)
    expect(parseNumber("۱۲", "fa-IR")).toBe(12)
    expect(parseNumber("−12", "en-US")).toBe(-12)
  })

  test("reads currency, percent and unit text", () => {
    const usd = { style: "currency", currency: "USD" } as const
    expect(parseNumber("$1,234.50", "en-US", usd)).toBe(1234.5)
    expect(parseNumber("-$5", "en-US", usd)).toBe(-5)
    expect(
      parseNumber("1.234,50 €", "de-DE", { style: "currency", currency: "EUR" })
    ).toBe(1234.5)
    expect(parseNumber("50%", "en-US", { style: "percent" })).toBe(0.5)
    expect(parseNumber("12.5", "en-US", { style: "percent" })).toBe(0.125)
    expect(
      parseNumber("5 km", "en-US", { style: "unit", unit: "kilometer" })
    ).toBe(5)
  })

  test("accepts what could still become a number", () => {
    expect(isPartialNumber("-", "en-US", undefined)).toBe(true)
    expect(isPartialNumber("1.", "en-US", undefined)).toBe(true)
    expect(
      isPartialNumber("$1,2", "en-US", { style: "currency", currency: "USD" })
    ).toBe(true)
    expect(isPartialNumber("1a", "en-US", undefined)).toBe(false)
    expect(
      isPartialNumber("-1", "en-US", undefined, { allowNegative: false })
    ).toBe(false)
  })
})
