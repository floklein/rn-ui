import {
  PasswordInput,
  PasswordInputControl,
  PasswordInputToggle,
} from "@ui-sdk/react-native/password-input"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"

function strength(password: string) {
  return [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password) && /[^a-zA-Z\d]/.test(password),
  ].filter(Boolean).length
}

function Example() {
  const [value, setValue] = useState("")
  const score = strength(value)
  return (
    <View style={styles.field}>
      <Text style={styles.label}>New password</Text>
      <PasswordInput
        value={value}
        onValueChange={(next) => setValue(next)}
        autoComplete="new-password"
        style={styles.root}
      >
        <PasswordInputControl
          aria-label="New password"
          style={styles.control}
        />
        <PasswordInputToggle aria-label="Show password" style={styles.toggle}>
          {(state) => <Eye open={!state.visible} />}
        </PasswordInputToggle>
      </PasswordInput>
      <View style={styles.meter}>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[styles.bar, score >= level && styles.barOn]}
          />
        ))}
      </View>
      <Text style={styles.hint}>
        {value
          ? `Strength: ${["Weak", "Weak", "Fair", "Good", "Strong"][score]} (${value.length} characters)`
          : "Type a password to rate it."}
      </Text>
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
  meter: { flexDirection: "row", gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#e4e4e7" },
  barOn: { backgroundColor: "#16a34a" },
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
