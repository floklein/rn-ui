import {
  createPasswordInputController,
  PasswordInput,
  PasswordInputControl,
  PasswordInputToggle,
} from "@ui-sdk/react-native/password-input"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.action}
    >
      <Text>{label}</Text>
    </Pressable>
  )
}

function Example() {
  const log = useLog()
  const [password] = useState(createPasswordInputController)
  return (
    <View style={styles.stack}>
      <View style={styles.actions}>
        <Action
          label="Suggest"
          onPress={() => {
            password.setValue("plum-kettle-orbit-42")
            password.setVisible(true)
          }}
        />
        <Action label="Toggle" onPress={() => password.toggleVisible()} />
        <Action label="Clear" onPress={() => password.clear()} />
        <Action
          label="Read"
          onPress={() =>
            log(
              `${password.getValue().length} characters, ${password.isVisible() ? "shown" : "hidden"}`
            )
          }
        />
        <Action label="Focus" onPress={() => password.focus()} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>New password</Text>
        <PasswordInput
          controller={password}
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
  stack: { alignSelf: "stretch", gap: 16 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
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
