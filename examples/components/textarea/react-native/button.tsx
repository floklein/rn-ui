import { Button } from "@ui-sdk/react-native/button"
import { createInputController, Textarea } from "@ui-sdk/react-native/textarea"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [message] = useState(createInputController)

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Message</Text>
      <Textarea
        aria-label="Message"
        controller={message}
        required
        placeholder="Write a reply to Hollis Grant…"
        style={styles.textarea}
      />
      <Button
        onPress={() => {
          log(`Sent “${message.getValue()}”`)
          message.clear()
        }}
        style={styles.button}
      >
        <Text style={styles.buttonLabel}>Send Message</Text>
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  field: { alignSelf: "stretch", gap: 8 },
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
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#18181b",
  },
  buttonLabel: { color: "#ffffff", fontSize: 16, fontWeight: "500" },
})

export { Example }
