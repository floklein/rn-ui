import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@ui-sdk/react-native/progress"
import { StyleSheet, View } from "react-native"

const bars = [
  {
    label: "Download",
    value: 120,
    max: 250,
    format: { style: "unit", unit: "gigabyte" },
  },
  {
    label: "Video render",
    value: 87.25,
    format: { style: "percent", maximumFractionDigits: 1 },
  },
  {
    label: "Backup",
    value: 45,
    max: 60,
    format: (minutes: number) => `${60 - minutes} min left`,
  },
  { label: "Synchronisierung", value: 40, locale: "de-DE" },
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
      {bars.map(({ label, ...options }) => (
        <Progress key={label} {...options} style={styles.progress}>
          <ProgressLabel style={styles.label}>{label}</ProgressLabel>
          <ProgressValue style={styles.value} />
          <ProgressTrack style={styles.track}>
            <ProgressIndicator style={styles.indicator} />
          </ProgressTrack>
        </Progress>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 20 },
  progress: {
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
