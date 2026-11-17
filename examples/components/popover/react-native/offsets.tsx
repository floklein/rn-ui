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

const choices = {
  sideOffset: { label: "Side offset", values: ["4", "8", "16", "24"] },
  alignOffset: { label: "Align offset", values: ["-16", "0", "16"] },
  collisionPadding: { label: "Collision padding", values: ["8", "24", "48"] },
}

type Name = keyof typeof choices

function Example() {
  const [offsets, setOffsets] = useState<Record<Name, string>>({
    sideOffset: "8",
    alignOffset: "0",
    collisionPadding: "8",
  })
  return (
    <View style={styles.stack}>
      {(Object.keys(choices) as Name[]).map((name) => (
        <View key={name} style={styles.choice}>
          <Text style={styles.label}>{choices[name].label}</Text>
          <SegmentedControl
            aria-label={choices[name].label}
            value={offsets[name]}
            onValueChange={(next) =>
              setOffsets({ ...offsets, [name]: next as string })
            }
            style={styles.controls}
          >
            {choices[name].values.map((value) => (
              <SegmentedControlItem
                key={value}
                value={value}
                style={(state) => [
                  styles.item,
                  state.checked && styles.checked,
                ]}
              >
                <Text>{value}</Text>
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </View>
      ))}
      <Popover>
        <PopoverTrigger style={styles.button}>
          <Text>Delivery</Text>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={Number(offsets.sideOffset)}
          alignOffset={Number(offsets.alignOffset)}
          collisionPadding={Number(offsets.collisionPadding)}
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
  stack: { gap: 12 },
  choice: { gap: 4 },
  label: { fontSize: 14, fontWeight: "500" },
  controls: { flexDirection: "row", gap: 4 },
  item: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  checked: { backgroundColor: "#e4e4e7" },
  button: {
    alignSelf: "flex-start",
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
