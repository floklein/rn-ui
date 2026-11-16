import { Textarea } from "@ui-sdk/react-native/textarea"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Message</Text>
      <Textarea
        aria-label="Message"
        placeholder="Type your message here…"
        style={styles.textarea}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  field: { alignSelf: "stretch", gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  textarea: {
    minHeight: 96,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
    fontSize: 16,
    textAlignVertical: "top",
  },
})

export { Example }
