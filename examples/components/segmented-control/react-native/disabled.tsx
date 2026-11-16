import {
  SegmentedControl,
  SegmentedControlIndicator,
  type SegmentedControlIndicatorState,
  SegmentedControlItem,
  type SegmentedControlItemState,
} from "@ui-sdk/react-native/segmented-control"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.stack}>
      <SegmentedControl
        aria-label="Theme"
        defaultValue="system"
        disabled
        style={styles.control}
      >
        <SegmentedControlIndicator style={indicatorStyle} />
        <SegmentedControlItem value="light" style={itemStyle}>
          <Text style={styles.label}>Light</Text>
        </SegmentedControlItem>
        <SegmentedControlItem value="dark" style={itemStyle}>
          <Text style={styles.label}>Dark</Text>
        </SegmentedControlItem>
        <SegmentedControlItem value="system" style={itemStyle}>
          <Text style={styles.label}>System</Text>
        </SegmentedControlItem>
      </SegmentedControl>
      <SegmentedControl
        aria-label="Billing period"
        defaultValue="monthly"
        style={styles.control}
      >
        <SegmentedControlIndicator style={indicatorStyle} />
        <SegmentedControlItem value="monthly" style={itemStyle}>
          <Text style={styles.label}>Monthly</Text>
        </SegmentedControlItem>
        <SegmentedControlItem value="yearly" style={itemStyle}>
          <Text style={styles.label}>Yearly</Text>
        </SegmentedControlItem>
        <SegmentedControlItem value="lifetime" disabled style={itemStyle}>
          <Text style={styles.label}>Lifetime</Text>
        </SegmentedControlItem>
      </SegmentedControl>
    </View>
  )
}

const itemStyle = (state: SegmentedControlItemState) => [
  styles.item,
  state.disabled && styles.disabled,
]

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
  stack: { gap: 16 },
  control: {
    flexDirection: "row",
    alignSelf: "flex-start",
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
  },
  item: { paddingHorizontal: 16, paddingVertical: 8 },
  disabled: { opacity: 0.5 },
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
