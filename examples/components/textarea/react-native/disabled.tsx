import { Textarea, type TextareaState } from "@ui-sdk/react-native/textarea"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Reply</Text>
      <Textarea
        disabled
        aria-label="Reply"
        defaultValue="Replies are closed for this thread."
        style={textareaStyle}
      />
    </View>
  )
}

const textareaStyle = (state: TextareaState) => [
  styles.textarea,
  state.disabled && styles.disabled,
]

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
  disabled: { opacity: 0.5 },
})

export { Example }
