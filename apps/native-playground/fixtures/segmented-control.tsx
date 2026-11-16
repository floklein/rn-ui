import {
  createSegmentedControlController,
  SegmentedControl,
  SegmentedControlIndicator,
  type SegmentedControlIndicatorState,
  SegmentedControlItem,
  type SegmentedControlItemState,
} from "@ui-sdk/react-native/segmented-control"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

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

function Item({
  value,
  label,
  disabled,
}: {
  value: string
  label: string
  disabled?: boolean
}) {
  return (
    <SegmentedControlItem
      value={value}
      disabled={disabled}
      testID={`item-${value}`}
      style={itemStyle}
    >
      <Text>{label}</Text>
    </SegmentedControlItem>
  )
}

function Fixture() {
  const [controller] = useState(() => createSegmentedControlController())
  const [lastChange, setLastChange] = useState("none")

  return (
    <View style={styles.fixture}>
      <Text testID="last-change">{lastChange}</Text>
      <SegmentedControl
        aria-label="View"
        controller={controller}
        onValueChange={(value, details) =>
          setLastChange(`${value}:${details.reason}:${details.source}`)
        }
        style={[styles.control, styles.measured]}
      >
        <SegmentedControlIndicator style={indicatorStyle}>
          {(state) => (
            <Text testID="indicator-box" style={styles.box}>
              {state.indicatorWidth === undefined
                ? "unmeasured"
                : `${Math.round(state.indicatorLeft ?? 0)},${Math.round(state.indicatorWidth)}`}
            </Text>
          )}
        </SegmentedControlIndicator>
        <Item value="list" label="List" />
        <Item value="grid" label="Grid" />
        <Item value="board" label="Board" />
        <Item value="table" label="Table" disabled />
      </SegmentedControl>
      <SegmentedControl
        aria-label="Size"
        defaultValue="small"
        readOnly
        style={styles.control}
      >
        <SegmentedControlIndicator style={indicatorStyle} />
        <Item value="small" label="Small" />
        <Item value="large" label="Large" />
      </SegmentedControl>
      <SegmentedControl
        aria-label="Theme"
        defaultValue="light"
        disabled
        style={styles.control}
      >
        <SegmentedControlIndicator style={indicatorStyle} />
        <Item value="light" label="Light" />
        <Item value="dark" label="Dark" />
      </SegmentedControl>
      <Pressable
        accessibilityRole="button"
        testID="set-board"
        onPress={() => controller.setValue("board")}
        style={styles.action}
      >
        <Text>Choose Board</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 12 },
  control: {
    flexDirection: "row",
    alignSelf: "flex-start",
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
  },
  measured: { marginBottom: 24 },
  item: { paddingHorizontal: 14, paddingVertical: 8 },
  disabled: { opacity: 0.5 },
  indicator: {
    position: "absolute",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#18181b",
    backgroundColor: "#ffffff",
  },
  box: { position: "absolute", top: "100%", marginTop: 8, fontSize: 12 },
  action: {
    alignSelf: "flex-start",
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
})

export { Fixture }
