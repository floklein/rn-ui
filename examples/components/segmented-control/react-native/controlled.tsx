import {
  createSegmentedControlController,
  SegmentedControl,
  SegmentedControlIndicator,
  type SegmentedControlIndicatorState,
  SegmentedControlItem,
} from "@ui-sdk/react-native/segmented-control"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [range] = useState(() => createSegmentedControlController())
  const [value, setValue] = useState<string | null>("week")

  return (
    <View style={styles.stack}>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          onPress={() => range.setValue("month")}
          style={styles.button}
        >
          <Text>Show Month</Text>
        </Pressable>
      </View>
      <SegmentedControl
        aria-label="Range"
        value={value}
        onValueChange={(next, details) => {
          setValue(next)
          log(`value: ${next} (${details.reason})`)
        }}
        controller={range}
        style={styles.control}
      >
        <SegmentedControlIndicator style={indicatorStyle} />
        <SegmentedControlItem value="day" style={styles.item}>
          <Text style={styles.label}>Day</Text>
        </SegmentedControlItem>
        <SegmentedControlItem value="week" style={styles.item}>
          <Text style={styles.label}>Week</Text>
        </SegmentedControlItem>
        <SegmentedControlItem value="month" style={styles.item}>
          <Text style={styles.label}>Month</Text>
        </SegmentedControlItem>
      </SegmentedControl>
    </View>
  )
}

const indicatorStyle = (state: SegmentedControlIndicatorState) => [
  styles.indicator,
  {
    left: state.indicatorLeft,
    top: state.indicatorTop,
    width: state.indicatorWidth,
    height: state.indicatorHeight,
  },
]

const styles = StyleSheet.create({
  stack: { gap: 12 },
  controls: { flexDirection: "row", gap: 8 },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  control: {
    flexDirection: "row",
    alignSelf: "flex-start",
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
  },
  item: { paddingHorizontal: 16, paddingVertical: 8 },
  label: { fontSize: 14, fontWeight: "500" },
  indicator: {
    position: "absolute",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
})

export { Example }
