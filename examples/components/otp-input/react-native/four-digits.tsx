import {
  OTPInput,
  OTPInputGroup,
  OTPInputSlot,
} from "@ui-sdk/react-native/otp-input"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>PIN</Text>
      <OTPInput aria-label="PIN" maxLength={4} textAlign="center">
        <OTPInputGroup style={styles.group}>
          {[0, 1, 2, 3].map((index) => (
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
  group: { flexDirection: "row", gap: 6 },
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
