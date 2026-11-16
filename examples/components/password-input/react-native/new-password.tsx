import {
  PasswordInput,
  PasswordInputControl,
  PasswordInputToggle,
} from "@ui-sdk/react-native/password-input"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"

const rules = [
  {
    label: "At least 8 characters",
    test: (password: string) => password.length >= 8,
  },
  { label: "A number", test: (password: string) => /\d/.test(password) },
  {
    label: "An uppercase and a lowercase letter",
    test: (password: string) =>
      /[a-z]/.test(password) && /[A-Z]/.test(password),
  },
]

function Example() {
  const [password, setPassword] = useState("")
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Create a password</Text>
      <PasswordInput
        value={password}
        autoComplete="new-password"
        onValueChange={(value) => setPassword(value)}
        style={styles.root}
      >
        <PasswordInputControl
          aria-label="Create a password"
          style={styles.control}
        />
        <PasswordInputToggle aria-label="Show password" style={styles.toggle}>
          {(state) => <Eye open={!state.visible} />}
        </PasswordInputToggle>
      </PasswordInput>
      <View accessibilityRole="list" style={styles.rules}>
        {rules.map((rule) => (
          <Text key={rule.label} style={styles.hint}>
            {rule.test(password) ? "Done" : "To do"}: {rule.label}
          </Text>
        ))}
      </View>
    </View>
  )
}

function Eye({ open }: { open: boolean }) {
  return (
    <View style={styles.eye}>
      <View style={styles.pupil} />
      {open ? null : <View style={styles.slash} />}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { alignSelf: "stretch", gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  root: {
    flexDirection: "row",
    alignItems: "center",
    paddingStart: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  control: { flex: 1, paddingVertical: 10, fontSize: 16 },
  hint: { fontSize: 14, color: "#71717a" },
  rules: { gap: 2 },
  toggle: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  eye: {
    width: 22,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#71717a",
    borderRadius: 11,
  },
  pupil: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#71717a" },
  slash: {
    position: "absolute",
    width: 26,
    height: 2,
    backgroundColor: "#71717a",
    transform: [{ rotate: "-30deg" }],
  },
})

export { Example }
