import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@ui-sdk/react-native/field"
import { Input } from "@ui-sdk/react-native/input"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const looksLikeEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

function Example() {
  const log = useLog()
  const [email, setEmail] = useState("")
  const [checked, setChecked] = useState(false)
  const invalid = checked && !looksLikeEmail(email)

  return (
    <View style={styles.stack}>
      <Field invalid={invalid} style={styles.field}>
        <FieldLabel style={styles.label}>Email</FieldLabel>
        <Input
          value={email}
          onValueChange={setEmail}
          placeholder="hollis@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, invalid && styles.inputInvalid]}
        />
        <FieldDescription style={styles.description}>
          We'll send you a confirmation link.
        </FieldDescription>
        <FieldError style={styles.error}>
          {email
            ? "Enter an email address like hollis@example.com."
            : "Enter your email address."}
        </FieldError>
      </Field>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setChecked(true)
          if (looksLikeEmail(email)) {
            log(`Subscribed ${email}`)
          }
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Subscribe</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { alignSelf: "stretch", gap: 16 },
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
  inputInvalid: { borderColor: "#dc2626" },
  description: { fontSize: 14, color: "#71717a" },
  error: { fontSize: 14, color: "#dc2626" },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#18181b",
  },
  buttonText: { fontSize: 16, fontWeight: "500", color: "#ffffff" },
})

export { Example }
