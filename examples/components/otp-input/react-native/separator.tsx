import {
  OTPInput,
  OTPInputGroup,
  OTPInputSeparator,
  OTPInputSlot,
} from "@ui-sdk/react-native/otp-input"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <OTPInput maxLength={6} aria-label="Verification code" style={styles.root}>
      <OTPInputGroup style={styles.group}>
        <Slot index={0} />
        <Slot index={1} />
      </OTPInputGroup>
      <OTPInputSeparator style={styles.separator} />
      <OTPInputGroup style={styles.group}>
        <Slot index={2} />
        <Slot index={3} />
      </OTPInputGroup>
      <OTPInputSeparator style={styles.separator} />
      <OTPInputGroup style={styles.group}>
        <Slot index={4} />
        <Slot index={5} />
      </OTPInputGroup>
    </OTPInput>
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
