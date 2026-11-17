import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import { Input } from "@ui-sdk/react-native/input"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react-native/popover"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.row}>
      <Popover>
        <PopoverTrigger style={styles.button}>
          <Text>Rename</Text>
        </PopoverTrigger>
        <PopoverContent style={styles.content}>
          <PopoverTitle style={styles.title}>Rename file</PopoverTitle>
          <PopoverDescription style={styles.description}>
            The screen reader starts on the title.
          </PopoverDescription>
          <Field style={styles.field}>
            <FieldLabel style={styles.label}>Name</FieldLabel>
            <Input defaultValue="Q3 roadmap.pdf" style={styles.input} />
          </Field>
          <View style={styles.actions}>
            <PopoverClose style={styles.button}>
              <Text>Cancel</Text>
            </PopoverClose>
            <PopoverClose style={[styles.button, styles.solid]}>
              <Text style={styles.solidText}>Save</Text>
            </PopoverClose>
          </View>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger style={styles.button}>
          <Text>Publish</Text>
        </PopoverTrigger>
        <PopoverContent initialFocus="content" style={styles.content}>
          <PopoverTitle style={styles.title}>Publish changes?</PopoverTitle>
          <PopoverDescription style={styles.description}>
            The screen reader starts on the popover itself.
          </PopoverDescription>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger style={styles.button}>
          <Text>Status</Text>
        </PopoverTrigger>
        <PopoverContent
          initialFocus="none"
          finalFocus="none"
          style={styles.content}
        >
          <PopoverTitle style={styles.title}>All systems normal</PopoverTitle>
          <PopoverDescription style={styles.description}>
            The screen reader stays on the trigger.
          </PopoverDescription>
        </PopoverContent>
      </Popover>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
    gap: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
})

export { Example }
