import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react-native/popover"
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@ui-sdk/react-native/segmented-control"
import { Textarea } from "@ui-sdk/react-native/textarea"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"

const modes = [
  { value: "false", label: "Non-modal" },
  { value: "true", label: "Modal" },
]

const notes = {
  false: "A press outside closes it and reaches what's under it.",
  true: "Screen readers reach only the popover, and a press outside only closes it.",
}

function Example() {
  const [mode, setMode] = useState<"false" | "true">("false")
  return (
    <View style={styles.stack}>
      <SegmentedControl
        aria-label="Modal"
        value={mode}
        onValueChange={(next) => setMode(next as "false" | "true")}
        style={styles.controls}
      >
        {modes.map((option) => (
          <SegmentedControlItem
            key={option.value}
            value={option.value}
            style={(state) => [styles.item, state.checked && styles.checked]}
          >
            <Text>{option.label}</Text>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <Popover modal={mode === "true"}>
        <PopoverTrigger style={styles.button}>
          <Text>Add Comment</Text>
        </PopoverTrigger>
        <PopoverContent style={styles.content}>
          <PopoverTitle style={styles.title}>Add a comment</PopoverTitle>
          <PopoverDescription style={styles.description}>
            {notes[mode]}
          </PopoverDescription>
          <Field style={styles.field}>
            <FieldLabel style={styles.label}>Comment</FieldLabel>
            <Textarea style={styles.input} />
          </Field>
          <View style={styles.row}>
            <PopoverClose style={styles.button}>
              <Text>Cancel</Text>
            </PopoverClose>
            <PopoverClose style={[styles.button, styles.solid]}>
              <Text style={styles.solidText}>Post</Text>
            </PopoverClose>
          </View>
        </PopoverContent>
      </Popover>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
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
  solid: { backgroundColor: "#18181b", borderColor: "#18181b" },
  solidText: { color: "#fafafa", fontWeight: "500" },
  content: {
    width: 280,
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 15, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
})

export { Example }
