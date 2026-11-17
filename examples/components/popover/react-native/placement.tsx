import {
  Popover,
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
]

const aligns = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
]

type Side = "top" | "right" | "bottom" | "left"
type Align = "start" | "center" | "end"

function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <SegmentedControl
      aria-label={label}
      value={value}
      onValueChange={(next) => onChange(next as string)}
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
      <Choice
        label="Side"
        options={sides}
        value={side}
        onChange={(next) => setSide(next as Side)}
      />
      <Choice
        label="Align"
        options={aligns}
        value={align}
        onChange={(next) => setAlign(next as Align)}
      />
      <Popover>
        <PopoverTrigger style={styles.button}>
          <Text>Delivery</Text>
        </PopoverTrigger>
        <PopoverContent
          side={side}
          align={align}
          sideOffset={8}
          style={styles.content}
        >
          <PopoverTitle style={styles.title}>Delivery window</PopoverTitle>
          <PopoverDescription style={styles.description}>
            Arrives Tuesday between 9 AM and noon.
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  content: {
    width: 220,
    gap: 6,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 15, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
})

export { Example }
