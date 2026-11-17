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
    <Popover>
      <PopoverTrigger style={styles.button}>
        <Text>Share</Text>
      </PopoverTrigger>
      <PopoverContent style={styles.content}>
        <View style={styles.stack}>
          <PopoverTitle style={styles.title}>Share this document</PopoverTitle>
          <PopoverDescription style={styles.description}>
            Anyone with the link can view it.
          </PopoverDescription>
        </View>
        <Field style={styles.stack}>
          <FieldLabel style={styles.label}>Link</FieldLabel>
          <Input
            readOnly
            defaultValue="acme.app/d/q3-roadmap"
            style={styles.input}
          />
        </Field>
        <View style={styles.row}>
          <PopoverClose style={styles.button}>
            <Text>Cancel</Text>
          </PopoverClose>
          <PopoverClose style={[styles.button, styles.solid]}>
            <Text style={styles.solidText}>Copy Link</Text>
          </PopoverClose>
        </View>
      </PopoverContent>
    </Popover>
  )
}

const styles = StyleSheet.create({
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
  stack: { gap: 6 },
  title: { fontSize: 15, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
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
