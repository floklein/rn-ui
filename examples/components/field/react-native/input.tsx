import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react-native/field"
import { Input } from "@ui-sdk/react-native/input"
import { StyleSheet } from "react-native"

function Example() {
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Username</FieldLabel>
      <Input
        placeholder="hollis"
        autoCapitalize="none"
        autoComplete="username"
        style={styles.input}
      />
      <FieldDescription style={styles.description}>
        Choose a unique username for your account.
      </FieldDescription>
    </Field>
  )
}

const styles = StyleSheet.create({
  field: { alignSelf: "stretch", gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  description: { fontSize: 14, color: "#71717a" },
})

export { Example }
