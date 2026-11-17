import { Checkbox, CheckboxIndicator } from "@ui-sdk/react-native/checkbox"
import { Input } from "@ui-sdk/react-native/input"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react-native/popover"
import { useState } from "react"
import { type HostInstance, StyleSheet, Text, View } from "react-native"

const types = [
  { label: "Documents", checked: true },
  { label: "Images", checked: false },
  { label: "Shared with me", checked: true },
]

function Example() {
  const [anchor, setAnchor] = useState<HostInstance | null>(null)
  return (
    <View style={styles.row}>
      <Input
        ref={setAnchor}
        placeholder="Search files…"
        aria-label="Search files"
        style={styles.input}
      />
      <Popover>
        <PopoverTrigger aria-label="Search filters" style={styles.button}>
          <Text>Filters</Text>
        </PopoverTrigger>
        <PopoverContent
          anchor={anchor}
          align="start"
          sideOffset={8}
          style={styles.content}
        >
          <PopoverTitle style={styles.title}>Filters</PopoverTitle>
          <PopoverDescription style={styles.description}>
            Show only these kinds of files.
          </PopoverDescription>
          <View style={styles.stack}>
            {types.map((type) => (
              <View key={type.label} style={styles.option}>
                <Checkbox
                  defaultChecked={type.checked}
                  aria-label={type.label}
                  style={styles.checkbox}
                >
                  <CheckboxIndicator style={styles.indicator} />
                </Checkbox>
                <Text>{type.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.actions}>
            <PopoverClose style={styles.button}>
              <Text>Cancel</Text>
            </PopoverClose>
            <PopoverClose style={[styles.button, styles.solid]}>
              <Text style={styles.solidText}>Apply</Text>
            </PopoverClose>
          </View>
        </PopoverContent>
      </Popover>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  solid: { backgroundColor: "#18181b", borderColor: "#18181b" },
  solidText: { color: "#fafafa", fontWeight: "500" },
  content: {
    width: 260,
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 15, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  stack: { gap: 8 },
  option: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#a1a1aa",
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#18181b",
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
})

export { Example }
