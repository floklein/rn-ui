import { Textarea } from "@ui-sdk/react-native/textarea"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Notes</Text>
      <Textarea
        aria-label="Notes"
        placeholder="Add notes for the delivery driver…"
        style={styles.textarea}
      />
      <Text style={styles.hint}>Your driver sees these notes.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  field: { alignSelf: "stretch", gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  textarea: {
    minHeight: 48,
    maxHeight: 160,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
    fontSize: 16,
    textAlignVertical: "top",
  },
  hint: { fontSize: 14, color: "#71717a" },
})

export { Example }
