import {
  OTPInput,
  OTPInputGroup,
  OTPInputSeparator,
  OTPInputSlot,
} from "@ui-sdk/react-native/otp-input"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Recovery code</Text>
      <OTPInput
        aria-label="Recovery code"
        maxLength={8}
        pattern="alphanumeric"
        style={styles.root}
      >
        <OTPInputGroup style={styles.group}>
          {[0, 1, 2, 3].map((index) => (
            <Slot key={index} index={index} />
          ))}
        </OTPInputGroup>
        <OTPInputSeparator style={styles.separator} />
        <OTPInputGroup style={styles.group}>
          {[4, 5, 6, 7].map((index) => (
            <Slot key={index} index={index} />
          ))}
        </OTPInputGroup>
      </OTPInput>
    </View>
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
    width: 34,
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
