import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  OTPInput,
  OTPInputGroup,
  OTPInputSeparator,
  OTPInputSlot,
} from "@ui-sdk/react-native/otp-input"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Verification code</FieldLabel>
      <OTPInput maxLength={6} style={styles.root}>
        <OTPInputGroup style={styles.group}>
          <Slot index={0} />
          <Slot index={1} />
          <Slot index={2} />
        </OTPInputGroup>
        <OTPInputSeparator style={styles.separator} />
        <OTPInputGroup style={styles.group}>
          <Slot index={3} />
          <Slot index={4} />
          <Slot index={5} />
        </OTPInputGroup>
      </OTPInput>
    </Field>
  )
}

function Slot({ index }: { index: number }) {
  return (
    <OTPInputSlot
      index={index}
      style={(slot) => [styles.slot, slot.active && styles.active]}
    >
      {(slot) =>
        slot.char === null ? (
          slot.hasFakeCaret && <View style={styles.caret} />
        ) : (
          <Text style={styles.char}>{slot.char}</Text>
        )
      }
    </OTPInputSlot>
  )
}

const styles = StyleSheet.create({
  field: { alignSelf: "stretch", gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  root: { flexDirection: "row", alignItems: "center", gap: 8 },
  group: { flexDirection: "row", gap: 6 },
  separator: { width: 12, height: 2, backgroundColor: "#71717a" },
  slot: {
    width: 40,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  active: { borderWidth: 2, borderColor: "#18181b" },
  char: { fontSize: 20, fontWeight: "500" },
  caret: { width: 1, height: 22, backgroundColor: "#18181b" },
})

export { Example }
