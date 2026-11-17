import {
  NumberInput,
  type NumberInputButtonState,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
} from "@ui-sdk/react-native/number-input"
import { StyleSheet, Text } from "react-native"

const buttonStyle = (
  state: NumberInputButtonState,
  { pressed }: { pressed: boolean }
) => [
  styles.button,
  pressed && styles.pressed,
  state.disabled && styles.disabled,
]

function Example() {
  return (
    <NumberInput defaultValue={1} min={0}>
      <NumberInputGroup style={styles.group}>
        <NumberInputDecrement aria-label="Decrease" style={buttonStyle}>
          <Text style={styles.sign}>−</Text>
        </NumberInputDecrement>
        <NumberInputControl aria-label="Quantity" style={styles.control} />
        <NumberInputIncrement aria-label="Increase" style={buttonStyle}>
          <Text style={styles.sign}>+</Text>
        </NumberInputIncrement>
      </NumberInputGroup>
    </NumberInput>
  )
}

const styles = StyleSheet.create({
  field: { alignSelf: "stretch", gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  hint: { fontSize: 13, color: "#71717a" },
  group: {
    flexDirection: "row",
    alignItems: "stretch",
    height: 40,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    overflow: "hidden",
  },
  control: {
    flex: 1,
    minWidth: 64,
    paddingHorizontal: 8,
    fontSize: 16,
    textAlign: "center",
    color: "#18181b",
  },
  button: { width: 40, alignItems: "center", justifyContent: "center" },
  pressed: { backgroundColor: "#f4f4f5" },
  disabled: { opacity: 0.4 },
  sign: { fontSize: 20 },
})

export { Example }
