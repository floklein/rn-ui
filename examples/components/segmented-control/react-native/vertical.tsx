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
      <Text style={styles.heading}>Vertical alignment</Text>
      <SegmentedControl
        aria-label="Vertical alignment"
        orientation="vertical"
        defaultValue="middle"
        style={styles.control}
      >
        <SegmentedControlIndicator style={indicatorStyle} />
        <SegmentedControlItem value="top" style={styles.item}>
          <Text style={styles.label}>Top</Text>
        </SegmentedControlItem>
        <SegmentedControlItem value="middle" style={styles.item}>
          <Text style={styles.label}>Middle</Text>
        </SegmentedControlItem>
        <SegmentedControlItem value="bottom" style={styles.item}>
          <Text style={styles.label}>Bottom</Text>
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
    alignSelf: "flex-start",
    minWidth: 160,
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
  },
  item: { paddingHorizontal: 16, paddingVertical: 10 },
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
