import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@ui-sdk/react-native/progress"
import { StyleSheet, View } from "react-native"

function Example() {
  return (
    <Progress value={18} style={styles.progress}>
      <ProgressLabel style={styles.label}>Battery</ProgressLabel>
      <ProgressValue style={styles.value}>
        {(state) =>
          state.status === "complete" ? "Charged" : `${state.text} charged`
        }
      </ProgressValue>
      <ProgressTrack style={styles.track}>
        <ProgressIndicator
          render={(props, state) => (
            <View
              {...props}
              style={[
                props.style,
                styles.indicator,
                (state.percent ?? 0) < 20 && styles.destructive,
              ]}
            />
          )}
        />
      </ProgressTrack>
    </Progress>
  )
}

const styles = StyleSheet.create({
  destructive: { backgroundColor: "#dc2626" },
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
