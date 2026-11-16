import {
  OTPInput,
  OTPInputGroup,
  OTPInputSlot,
} from "@ui-sdk/react-native/otp-input"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  const [invalid, setInvalid] = useState(true)

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Verification code</Text>
      <OTPInput
        aria-label="Verification code"
        defaultValue="482913"
        onValueChange={() => setInvalid(false)}
      >
        <OTPInputGroup style={styles.group}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Slot key={index} index={index} invalid={invalid} />
          ))}
        </OTPInputGroup>
      </OTPInput>
      {invalid && (
        <Text style={styles.error}>
          That code has expired. Request a new one.
        </Text>
      )}
    </View>
  )
}

function Slot({ index, invalid }: { index: number; invalid: boolean }) {
  return (
    <OTPInputSlot
      index={index}
      style={(slot) => [
        styles.slot,
        invalid && styles.invalid,
        slot.active && styles.active,
      ]}
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
  invalid: { borderColor: "#dc2626" },
  error: { fontSize: 14, color: "#dc2626" },
})

export { Example }
