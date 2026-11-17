import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./locale"
import type * as Native from "./locale.native"

function toLocale(tag: string | null | undefined) {
  try {
    return Intl.getCanonicalLocales(
      tag ? tag.replace(/[.@].*$/, "").replaceAll("_", "-") : []
    )[0]
  } catch {}
}

// Hermes's Intl defaults to the device's language.
function userLocale() {
  return toLocale(Intl.DateTimeFormat().resolvedOptions().locale)
}

// There is no page, so its language is the device's.
function pageLocale(_el?: Element) {
  return userLocale()
}

function bindPageLocale(_el: Element, set: (locale: string | null) => void) {
  set(userLocale() ?? null)
}

// No server renders first, so the first frame is already in the device's language.
const localeOf = (state: {
  locale?: string | null | undefined
  pageLocale?: string | null
}) => state.locale ?? state.pageLocale ?? userLocale() ?? "en-US"

true satisfies Twin<typeof Mirrored, typeof Native>

export { bindPageLocale, localeOf, pageLocale, toLocale, userLocale }
