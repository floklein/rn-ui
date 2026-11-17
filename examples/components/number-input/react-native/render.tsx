import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  NumberInput,
  type NumberInputButtonState,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
} from "@ui-sdk/react-native/number-input"
import { Pressable, StyleSheet, Text } from "react-native"

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
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Temperature</FieldLabel>
      <NumberInput
        defaultValue={-2}
        min={-20}
        max={40}
        format={{ style: "unit", unit: "celsius" }}
      >
        <NumberInputGroup style={styles.group}>
          <NumberInputDecrement
            aria-label="Colder"
            style={buttonStyle}
            render={(props, state) => (
              <Pressable
                {...props}
                accessibilityHint={
                  state.atBound ? "As cold as it goes" : undefined
                }
              />
            )}
          >
            <Text style={styles.sign}>−</Text>
          </NumberInputDecrement>
          <NumberInputControl style={styles.control} />
          <NumberInputIncrement aria-label="Warmer" style={buttonStyle}>
            {(state) => (
              <Text style={styles.sign}>{state.atBound ? "Max" : "+"}</Text>
            )}
          </NumberInputIncrement>
        </NumberInputGroup>
      </NumberInput>
    </Field>
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
