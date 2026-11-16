import {
  SegmentedControl,
  SegmentedControlIndicator,
  type SegmentedControlIndicatorState,
  SegmentedControlItem,
} from "@ui-sdk/react-native/segmented-control"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.stack}>
      <Text style={styles.heading}>View</Text>
      <SegmentedControl
        aria-label="View"
        defaultValue="list"
        style={styles.control}
      >
        <SegmentedControlIndicator style={indicatorStyle} />
        <SegmentedControlItem value="list" style={styles.item}>
          <Text style={styles.label}>List</Text>
        </SegmentedControlItem>
        <SegmentedControlItem value="grid" style={styles.item}>
          <Text style={styles.label}>Grid</Text>
        </SegmentedControlItem>
        <SegmentedControlItem value="board" style={styles.item}>
          <Text style={styles.label}>Board</Text>
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
  stack: { gap: 8 },
  heading: { fontSize: 17, fontWeight: "600" },
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
