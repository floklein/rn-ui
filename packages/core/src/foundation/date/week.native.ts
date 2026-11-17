import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./week"
import type * as Native from "./week.native"

// Hermes's Intl has no `Intl.Locale`, so the first day of the week comes from
// the region in the tag and a table of CLDR's regions.

// Regions whose week doesn't start on Monday, from CLDR's `weekData.firstDay`:
// https://github.com/unicode-org/cldr-json/blob/main/cldr-json/cldr-core/supplemental/weekData.json
const regionDays = new Map<string, number>()
for (const [day, regions] of [
  [
    0,
    "AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN IS JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW",
  ],
  [5, "MV"],
  [6, "AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY"],
] as const) {
  for (const region of regions.split(" ")) {
    regionDays.set(region, day)
  }
}

// The `-u-fw-` extension a tag can carry to pick the first day itself, like `en-US-u-fw-mon`.
const extensionDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

const cache = new Map<string, number>()

function firstDayOfWeek(locale?: string) {
  const key = locale ?? ""
  let day = cache.get(key)
  if (day === undefined) {
    cache.set(key, (day = resolveFirstDay(locale)))
  }
  return day
}

function resolveFirstDay(locale: string | undefined) {
  let tag: string | undefined
  try {
    tag = Intl.getCanonicalLocales(
      locale ?? new Intl.DateTimeFormat().resolvedOptions().locale
    )[0]
  } catch {}
  if (!tag) {
    return 1
  }
  const extension = /-u(?:-[a-z0-9]{2,8})*?-fw-([a-z]{3})\b/i
    .exec(tag)?.[1]
    ?.toLowerCase()
  if (extension && extensionDays.includes(extension)) {
    return extensionDays.indexOf(extension)
  }
  const region = /^[a-z]{2,3}(?:-[a-z]{4})?-([a-z]{2}|\d{3})(?:-|$)/i
    .exec(tag)?.[1]
    ?.toUpperCase()
  return regionDays.get(region ?? "") ?? 1
}

true satisfies Twin<typeof Mirrored, typeof Native>

export { firstDayOfWeek }
