import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./number-parts"
import type * as Native from "./number-parts.native"

const signs: Record<string, Intl.NumberFormatPartTypes> = {
  "-": "minusSign",
  "−": "minusSign",
  "+": "plusSign",
}

// Hermes on iOS formats numbers but has no `formatToParts`. The number runs
// from its first digit to its last; between them, the last separator is the
// decimal one when fractions show, and the others group. The rest is text.
function numberParts(formatter: Intl.NumberFormat, value: number) {
  const { numberingSystem, maximumFractionDigits = 0 } =
    formatter.resolvedOptions()
  const plain = new Intl.NumberFormat("en", {
    numberingSystem,
    useGrouping: false,
  })
  const digits = new Set(
    Array.from({ length: 10 }, (_, digit) => plain.format(digit))
  )
  const text = formatter.format(value)
  const chars = Array.from(text)
  const first = chars.findIndex((char) => digits.has(char))
  const parts: Intl.NumberFormatPart[] = []
  const affix = (from: number, to: number) => {
    let literal = ""
    for (const char of chars.slice(from, to)) {
      if (signs[char]) {
        if (literal) {
          parts.push({ type: "literal", value: literal })
          literal = ""
        }
        parts.push({ type: signs[char], value: char })
      } else {
        literal += char
      }
    }
    if (literal) {
      parts.push({ type: "literal", value: literal })
    }
  }
  if (first === -1) {
    affix(0, chars.length)
    return parts
  }
  let last = chars.length - 1
  while (!digits.has(chars[last])) {
    last--
  }
  affix(0, first)
  const runs: { digits: boolean; value: string }[] = []
  for (const char of chars.slice(first, last + 1)) {
    const isDigit = digits.has(char)
    const run = runs[runs.length - 1]
    if (run?.digits === isDigit) {
      run.value += char
    } else {
      runs.push({ digits: isDigit, value: char })
    }
  }
  const separators = runs.filter((run) => !run.digits).length
  let seen = 0
  let integer = true
  for (const run of runs) {
    if (run.digits) {
      parts.push({ type: integer ? "integer" : "fraction", value: run.value })
      continue
    }
    seen++
    const decimal = maximumFractionDigits > 0 && seen === separators
    integer = !decimal
    parts.push({ type: decimal ? "decimal" : "group", value: run.value })
  }
  affix(last + 1, chars.length)
  return parts
}

true satisfies Twin<typeof Mirrored, typeof Native>

export { numberParts }
