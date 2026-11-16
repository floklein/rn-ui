import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  OTPInput,
  OTPInputGroup,
  OTPInputSlot,
} from "@ui-sdk/react-native/otp-input"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Device code</FieldLabel>
      <OTPInput maxLength={6} pattern={/[0-9A-F]/i} inputMode="text">
        <OTPInputGroup style={styles.group}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Slot key={index} index={index} />
          ))}
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
