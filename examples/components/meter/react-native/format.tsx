import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@ui-sdk/react-native/meter"
import { StyleSheet, View } from "react-native"

const meters = [
  {
    label: "Storage",
    value: 120,
    max: 250,
    format: { style: "unit", unit: "gigabyte" },
  },
  {
    label: "Budget",
    value: 1840,
    max: 2500,
    format: { style: "currency", currency: "USD", maximumFractionDigits: 0 },
  },
  {
    label: "Seats",
    value: 18,
    max: 25,
    format: (seats: number) => `${seats} of 25 seats`,
  },
  { label: "Auslastung", value: 40, locale: "de-DE" },
] satisfies {
  label: string
  value: number
  max?: number
  format?: Intl.NumberFormatOptions | ((value: number) => string)
  locale?: string
}[]

function Example() {
  return (
    <View style={styles.stack}>
      {meters.map(({ label, ...options }) => (
        <Meter key={label} {...options} style={styles.meter}>
          <MeterLabel style={styles.label}>{label}</MeterLabel>
          <MeterValue style={styles.value} />
          <MeterTrack style={styles.track}>
            <MeterIndicator style={styles.indicator} />
          </MeterTrack>
        </Meter>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 20 },
  meter: {
    flexDirection: "row",
    minHeight: 44,
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: 8,
    columnGap: 12,
    width: 320,
    maxWidth: "100%",
  },
  label: { fontSize: 15, fontWeight: "500" },
  value: {
    marginStart: "auto",
    color: "#71717a",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  track: {
    flexDirection: "row",
    width: "100%",
    height: 10,
    padding: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#f4f4f5",
    overflow: "hidden",
  },
  indicator: { height: "100%", borderRadius: 999, backgroundColor: "#18181b" },
})

export { Example }
