import { Textarea } from "@ui-sdk/react-native/textarea"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  const [bio, setBio] = useState(
    "Product designer in Lisbon. I write about type and interfaces."
  )

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Bio</Text>
      <Textarea
        aria-label="Bio"
        value={bio}
        onValueChange={setBio}
        maxLength={160}
        style={styles.textarea}
      />
      <Text style={styles.hint}>{bio.length} / 160 characters</Text>
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
  hint: { fontSize: 14, color: "#71717a" },
})

export { Example }
