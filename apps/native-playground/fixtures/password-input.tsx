import {
  createPasswordInputController,
  PasswordInput,
  PasswordInputControl,
  type PasswordInputOptions,
  PasswordInputToggle,
} from "@ui-sdk/react-native/password-input"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

type Change = NonNullable<PasswordInputOptions["onValueChange"]>
type VisibleChange = NonNullable<PasswordInputOptions["onVisibleChange"]>

function Fixture() {
  const [password] = useState(createPasswordInputController)
  const [changes, setChanges] = useState<string[]>([])
  const record = (entry: string) => setChanges((current) => [...current, entry])
  const typed: Change = (_value, details) =>
    record(`value:${details.reason}:${details.source}`)
  const shown: VisibleChange = (visible, details) =>
    record(
      `${visible ? "shown" : "hidden"}:${details.reason}:${details.source}`
    )

  return (
    <View style={styles.fixture}>
      <Text testID="changes">{changes.join(" ") || "none"}</Text>
      <PasswordInput
        controller={password}
        onValueChange={typed}
        onVisibleChange={shown}
        style={styles.root}
      >
        <Text testID="password-affix">Key</Text>
        <PasswordInputControl
          aria-label="Password"
          testID="password-control"
          style={styles.control}
        />
        <PasswordInputToggle
          aria-label="Show password"
          testID="password-toggle"
          style={styles.toggle}
        >
          <View style={styles.eye} />
        </PasswordInputToggle>
      </PasswordInput>
      <PasswordInput readOnly defaultValue="7Hq2-vX9p" style={styles.root}>
        <PasswordInputControl
          aria-label="Recovery key"
          testID="password-readonly"
          style={styles.control}
        />
        <PasswordInputToggle
          aria-label="Show recovery key"
          testID="toggle-readonly"
          style={styles.toggle}
        >
          <View style={styles.eye} />
        </PasswordInputToggle>
      </PasswordInput>
      <PasswordInput disabled defaultValue="hunter22" style={styles.root}>
        <PasswordInputControl
          aria-label="Account password"
          testID="password-disabled"
          style={styles.control}
        />
        <PasswordInputToggle
          aria-label="Show account password"
          testID="toggle-disabled"
          style={styles.toggle}
        >
          <View style={styles.eye} />
        </PasswordInputToggle>
      </PasswordInput>
      <Pressable
        accessibilityRole="button"
        testID="focus-password"
        onPress={() => password.focus()}
        style={styles.action}
      >
        <Text>Focus password</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingStart: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  control: { flex: 1, paddingVertical: 8, fontSize: 16 },
  toggle: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  eye: { width: 20, height: 12, borderWidth: 2, borderRadius: 10 },
  action: {
    alignSelf: "flex-start",
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
})

export { Fixture }
