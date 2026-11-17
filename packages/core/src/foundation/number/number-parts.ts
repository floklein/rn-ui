// Its native twin works the parts out from the formatted text, since Hermes
// on iOS has no `formatToParts`.
function numberParts(formatter: Intl.NumberFormat, value: number) {
  return formatter.formatToParts(value)
}

export { numberParts }
