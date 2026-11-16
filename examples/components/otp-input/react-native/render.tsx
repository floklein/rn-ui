import {
  OTPInput,
  OTPInputGroup,
  OTPInputSlot,
} from "@ui-sdk/react-native/otp-input"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <OTPInput maxLength={5} aria-label="Invite code">
      {(state) => (
        <OTPInputGroup style={styles.group}>
          {state.slots.map((_, index) => (
            <OTPInputSlot
              key={index}
              index={index}
              render={(props, slot) => (
                <View
                  {...props}
                  style={[
                    props.style,
                    styles.slot,
                    slot.active && styles.active,
                  ]}
                />
              )}
            >
              {(slot) =>
                slot.char === null ? (
                  slot.hasFakeCaret && <View style={styles.caret} />
                ) : (
                  <Text style={styles.char}>{slot.char}</Text>
                )
              }
            </OTPInputSlot>
          ))}
        </OTPInputGroup>
      )}
    </OTPInput>
  )
}

const styles = StyleSheet.create({
  group: { flexDirection: "row", gap: 6 },
  slot: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 24,
  },
  active: { borderWidth: 2, borderColor: "#18181b" },
  char: { fontSize: 20, fontWeight: "500" },
  caret: { width: 1, height: 22, backgroundColor: "#18181b" },
})

export { Example }
