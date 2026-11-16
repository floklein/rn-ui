import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@ui-sdk/react-native/meter"
import { StyleSheet, View } from "react-native"

function Example() {
  return (
    <Meter value={91} style={styles.meter}>
      <MeterLabel style={styles.label}>Disk</MeterLabel>
      <MeterValue style={styles.value}>
        {(state) => `${state.text} used`}
      </MeterValue>
      <MeterTrack style={styles.track}>
        <MeterIndicator
          render={(props, state) => (
            <View
              {...props}
              style={[
                props.style,
                styles.indicator,
                state.percent >= 90 && styles.destructive,
              ]}
            />
          )}
        />
      </MeterTrack>
    </Meter>
  )
}

const styles = StyleSheet.create({
  destructive: { backgroundColor: "#dc2626" },
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
