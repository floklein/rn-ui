import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  NumberInput,
  type NumberInputButtonState,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
} from "@ui-sdk/react-native/number-input"
import { StyleSheet, Text, View } from "react-native"

const fields = [
  {
    label: "Price",
    defaultValue: 19.99,
    step: 0.01,
    format: { style: "currency", currency: "USD" },
  },
  {
    label: "Discount",
    defaultValue: 0.15,
    step: 0.01,
    format: { style: "percent" },
  },
  {
    label: "Weight",
    defaultValue: 2.5,
    step: 0.1,
    format: { style: "unit", unit: "kilogram" },
  },
] satisfies {
  label: string
  defaultValue: number
  step: number
  format: Intl.NumberFormatOptions
}[]

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
    <View style={styles.stack}>
      {fields.map(({ label, ...options }) => (
        <Field key={label} style={styles.field}>
          <FieldLabel style={styles.label}>{label}</FieldLabel>
          <NumberInput {...options} min={0}>
            <NumberInputGroup style={styles.group}>
              <NumberInputDecrement aria-label="Decrease" style={buttonStyle}>
                <Text style={styles.sign}>−</Text>
              </NumberInputDecrement>
              <NumberInputControl style={styles.control} />
              <NumberInputIncrement aria-label="Increase" style={buttonStyle}>
                <Text style={styles.sign}>+</Text>
              </NumberInputIncrement>
            </NumberInputGroup>
          </NumberInput>
        </Field>
      ))}
    </View>
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
  stack: { alignSelf: "stretch", gap: 16 },
})

export { Example }
