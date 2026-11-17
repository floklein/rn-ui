/**
 * The parts `formatter` writes `value` in. Its native twin works them out
 * from the formatted text, since Hermes on iOS has no `formatToParts`.
 */
function numberParts(formatter: Intl.NumberFormat, value: number) {
  return formatter.formatToParts(value)
}

export { numberParts }
