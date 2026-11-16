import {
  createOTPInputController,
  OTPInput,
  OTPInputGroup,
  type OTPInputOptions,
  OTPInputSlot,
  type OTPInputState,
} from "@ui-sdk/react-native/otp-input"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

type Change = NonNullable<OTPInputOptions["onValueChange"]>
type Commit = NonNullable<OTPInputOptions["onValueCommit"]>

const drawn = (state: OTPInputState) =>
  state.slots
    .map((slot) => `${slot.char ?? "empty"}${slot.active ? " active" : ""}`)
    .join(", ")

function Slots() {
  return (
    <OTPInputGroup style={styles.group}>
      {[0, 1, 2, 3].map((index) => (
        <OTPInputSlot
          key={index}
          index={index}
          style={(slot) => [styles.slot, slot.active && styles.active]}
        >
          {(slot) => <Text style={styles.char}>{slot.char}</Text>}
        </OTPInputSlot>
      ))}
    </OTPInputGroup>
  )
}

function Fixture() {
  const [code] = useState(createOTPInputController)
  const [changes, setChanges] = useState<string[]>([])
  const record = (entry: string) => setChanges((current) => [...current, entry])
  const typed: Change = (_value, details) =>
    record(`value:${details.reason}:${details.source}`)
  const committed: Commit = (value, details) =>
    record(`commit:${value}:${details.reason}`)

  return (
    <View style={styles.fixture}>
      <Text testID="changes">{changes.join(" ") || "none"}</Text>
      <OTPInput
        aria-label="Code"
        maxLength={4}
        controller={code}
        onValueChange={typed}
        onValueCommit={committed}
        style={styles.root}
      >
        {(state) => (
          <>
            <Slots />
            <Text testID="code-slots">{drawn(state)}</Text>
          </>
        )}
      </OTPInput>
      <OTPInput
        aria-label="Disabled code"
        maxLength={4}
        disabled
        defaultValue="12"
        style={styles.root}
      >
        {(state) => (
          <>
            <Slots />
            <Text testID="disabled-slots">{drawn(state)}</Text>
          </>
        )}
      </OTPInput>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          testID="focus-code"
          onPress={() => code.focus()}
          style={styles.action}
        >
          <Text>Focus code</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="fill-code"
          onPress={() => code.setValue("1234")}
          style={styles.action}
        >
          <Text>Fill 1234</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 12 },
  root: { alignSelf: "flex-start", gap: 4 },
  group: { flexDirection: "row", gap: 8 },
  slot: {
    width: 40,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  active: { borderWidth: 2, borderColor: "#18181b" },
  char: { fontSize: 20 },
  actions: { flexDirection: "row", gap: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
})

export { Fixture }
