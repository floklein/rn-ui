import { Button, type ButtonState } from "@ui-sdk/react-native/button"
import { useState } from "react"
import { StyleSheet, Text, TextInput, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [title, setTitle] = useState("")
  const ready = title.trim() !== ""
  const hint = ready ? "Ready to publish." : "Add a title to publish."

  return (
    <View style={styles.stack}>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          aria-label="Title"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
      </View>
      <View style={styles.row}>
        <Button
          disabled={!ready}
          focusableWhenDisabled
          aria-description={hint}
          onPress={() => log(`Published “${title}”`)}
          style={buttonStyle}
        >
          <Text style={styles.label}>Publish</Text>
        </Button>
        <Text style={styles.hint}>{hint}</Text>
      </View>
    </View>
  )
}

const buttonStyle = (state: ButtonState) => [
  styles.button,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  stack: { gap: 16, alignSelf: "stretch" },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#18181b",
  },
  disabled: { opacity: 0.5 },
  label: { color: "#ffffff", fontSize: 16, fontWeight: "500" },
  hint: { flexShrink: 1, fontSize: 14, color: "#71717a" },
})

export { Example }
