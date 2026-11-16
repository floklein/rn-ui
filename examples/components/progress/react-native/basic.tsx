import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@ui-sdk/react-native/progress"
import { StyleSheet } from "react-native"

function Example() {
  return (
    <Progress value={60} style={styles.progress}>
      <ProgressLabel style={styles.label}>Exporting video</ProgressLabel>
      <ProgressValue style={styles.value} />
      <ProgressTrack style={styles.track}>
        <ProgressIndicator style={styles.indicator} />
      </ProgressTrack>
    </Progress>
  )
}

const styles = StyleSheet.create({
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
