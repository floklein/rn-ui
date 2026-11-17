import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./format"
import type * as Native from "./format.native"
import { dateParts, type ISODate } from "./plain-date"

// Calendars whose months are the Gregorian ones; format.ts says why.
const gregorianMonths = new Set([
  "gregory",
  "iso8601",
  "buddhist",
  "japanese",
  "roc",
])

const formatters = new Map<string, Intl.DateTimeFormat>()

function dateFormatter(
  locale?: string,
  options: Intl.DateTimeFormatOptions = {}
) {
  const key = `${locale ?? ""}|${JSON.stringify(options)}`
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" })
    if (!gregorianMonths.has(formatter.resolvedOptions().calendar)) {
      formatter = new Intl.DateTimeFormat(locale, {
        ...options,
        calendar: "gregory",
        timeZone: "UTC",
      })
    }
    formatters.set(key, formatter)
  }
  return formatter
}

function utc(date: ISODate) {
  const parts = dateParts(date)
  if (!parts) {
    throw new RangeError(`"${date}" is not an ISO date (YYYY-MM-DD).`)
  }
  const time = new Date(0)
  // `setUTCFullYear` keeps years below 100 as they are, which `Date.UTC` doesn't.
  time.setUTCFullYear(parts.year, parts.month - 1, parts.day)
  return time
}

function formatDate(
  date: ISODate,
  locale?: string,
  options: Intl.DateTimeFormatOptions = longDate
) {
  return dateFormatter(locale, options).format(utc(date))
}

function formatDateRange(
  start: ISODate,
  end: ISODate,
  locale?: string,
  options: Intl.DateTimeFormatOptions = mediumDate
) {
  // Hermes's Intl has no `formatRange`, so the range is its two dates.
  const formatter = dateFormatter(locale, options)
  return `${formatter.format(utc(start))} – ${formatter.format(utc(end))}`
}

function formatDateToParts(
  date: ISODate,
  locale?: string,
  options: Intl.DateTimeFormatOptions = longDate
) {
  return dateFormatter(locale, options).formatToParts(utc(date))
}

function monthNames(
  locale?: string,
  width: "long" | "short" | "narrow" = "long"
) {
  const formatter = dateFormatter(locale, { month: width })
  return Array.from({ length: 12 }, (_, index) =>
    formatter.format(Date.UTC(2026, index, 1))
  )
}

function weekdayNames(
  locale?: string,
  width: "long" | "short" | "narrow" = "short",
  weekStartsOn = 0
) {
  const formatter = dateFormatter(locale, { weekday: width })
  // January 4 2026 was a Sunday.
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(Date.UTC(2026, 0, 4 + ((weekStartsOn + index) % 7)))
  )
}

function todayDate(timeZone?: string) {
  const parts = todayFormatter(timeZone).formatToParts(Date.now())
  const read = (type: string) => parts.find((part) => part.type === type)!.value
  return `${read("year").padStart(4, "0")}-${read("month")}-${read("day")}`
}

const todayFormatters = new Map<string, Intl.DateTimeFormat>()

function todayFormatter(timeZone: string | undefined) {
  const key = timeZone ?? ""
  let formatter = todayFormatters.get(key)
  if (!formatter) {
    // Pinned to a locale, calendar and digits whose parts read as an ISO date.
    formatter = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    todayFormatters.set(key, formatter)
  }
  return formatter
}

const longDate: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
}
const mediumDate: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
}

true satisfies Twin<typeof Mirrored, typeof Native>

export {
  dateFormatter,
  formatDate,
  formatDateRange,
  formatDateToParts,
  monthNames,
  todayDate,
  weekdayNames,
}
