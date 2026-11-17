import {
  Popover,
  PopoverArrow,
  type PopoverArrowPlacementState,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react-native/popover"
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@ui-sdk/react-native/segmented-control"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"

const sides = [
  { value: "top", label: "Top" },
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
] as const
type Side = (typeof sides)[number]["value"]

const size = 12

const edge = {
  top: { bottom: -size / 2 },
  bottom: { top: -size / 2 },
  left: { right: -size / 2 },
  right: { left: -size / 2 },
}

function arrowStyle(state: PopoverArrowPlacementState) {
  return [styles.arrow, state.side && edge[state.side]]
}

function Example() {
  const [side, setSide] = useState<Side>("bottom")
  return (
    <View style={styles.stack}>
      <SegmentedControl
        aria-label="Side"
        value={side}
        onValueChange={(next) => setSide(next as Side)}
        style={styles.controls}
      >
        {sides.map((option) => (
          <SegmentedControlItem
            key={option.value}
            value={option.value}
            style={(state) => [styles.item, state.checked && styles.checked]}
          >
            <Text>{option.label}</Text>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <Popover>
        <PopoverTrigger aria-label="Help" style={styles.button}>
          <Text>?</Text>
        </PopoverTrigger>
        <PopoverContent
          side={side}
          sideOffset={10}
          arrowPadding={12}
          style={styles.content}
        >
          <PopoverArrow style={arrowStyle} />
          <PopoverTitle style={styles.title}>Keyboard shortcuts</PopoverTitle>
          <PopoverDescription style={styles.description}>
            Press ? anywhere to see them all.
          </PopoverDescription>
        </PopoverContent>
      </Popover>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16, alignItems: "center" },
  controls: { flexDirection: "row", gap: 4 },
  item: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  checked: { backgroundColor: "#e4e4e7" },
  button: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 20,
    borderColor: "#d4d4d8",
  },
  content: {
    width: 220,
    gap: 6,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#18181b",
  },
  arrow: {
    width: size,
    height: size,
    backgroundColor: "#18181b",
    transform: [{ rotate: "45deg" }],
  },
  title: { fontSize: 15, fontWeight: "600", color: "#fafafa" },
  description: { fontSize: 14, color: "#a1a1aa" },
})

export { Example }
