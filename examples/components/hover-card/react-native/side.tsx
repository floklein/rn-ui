import {
  HoverCard,
  HoverCardArrow,
  type HoverCardArrowPlacementState,
  HoverCardContent,
  HoverCardTrigger,
} from "@ui-sdk/react-native/hover-card"
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@ui-sdk/react-native/segmented-control"
import { useState } from "react"
import { Linking, StyleSheet, Text, View } from "react-native"

const sides = [
  { value: "top", label: "Top" },
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
] as const
const aligns = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
] as const
type Side = (typeof sides)[number]["value"]
type Align = (typeof aligns)[number]["value"]

const size = 10

const edge = {
  top: { bottom: -size / 2 },
  bottom: { top: -size / 2 },
  left: { right: -size / 2 },
  right: { left: -size / 2 },
}

function arrowStyle(state: HoverCardArrowPlacementState) {
  return [styles.arrow, state.side && edge[state.side]]
}

function Choice<Value extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { value: Value; label: string }[]
  value: Value
  onChange: (value: Value) => void
}) {
  return (
    <SegmentedControl
      aria-label={label}
      value={value}
      onValueChange={(next) => onChange(next as Value)}
      style={styles.controls}
    >
      {options.map((option) => (
        <SegmentedControlItem
          key={option.value}
          value={option.value}
          style={(state) => [styles.item, state.checked && styles.checked]}
        >
          <Text>{option.label}</Text>
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  )
}

function Example() {
  const [side, setSide] = useState<Side>("bottom")
  const [align, setAlign] = useState<Align>("center")
  return (
    <View style={styles.stack}>
      <Choice label="Side" options={sides} value={side} onChange={setSide} />
      <Choice
        label="Align"
        options={aligns}
        value={align}
        onChange={setAlign}
      />
      <HoverCard defaultOpen>
        <HoverCardTrigger
          onPress={() => Linking.openURL("https://example.com/people/ines")}
        >
          <Text style={styles.link}>@ines</Text>
        </HoverCardTrigger>
        <HoverCardContent
          side={side}
          align={align}
          sideOffset={10}
          style={styles.card}
        >
          <HoverCardArrow style={arrowStyle} />
          <Text style={styles.name}>Inès Moreau</Text>
          <Text style={styles.bio}>
            Product designer. Leads the checkout redesign.
          </Text>
        </HoverCardContent>
      </HoverCard>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16, alignItems: "center" },
  controls: { flexDirection: "row", gap: 4 },
  item: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  checked: { backgroundColor: "#e4e4e7" },
  link: { color: "#2563eb", textDecorationLine: "underline" },
  card: {
    width: 220,
    gap: 4,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  arrow: {
    width: size,
    height: size,
    backgroundColor: "#ffffff",
    transform: [{ rotate: "45deg" }],
  },
  name: { fontWeight: "600" },
  bio: { fontSize: 13, color: "#3f3f46" },
})

export { Example }
