import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  NumberInput,
  type NumberInputButtonState,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
} from "@ui-sdk/react-native/number-input"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.action}
    >
      <Text>{label}</Text>
    </Pressable>
  )
}

const buttonStyle = (
  state: NumberInputButtonState,
  { pressed }: { pressed: boolean }
) => [
  styles.button,
  pressed && styles.pressed,
  state.disabled && styles.disabled,
]

function Example() {
  const log = useLog()
  const [value, setValue] = useState<number | null>(4)

  return (
    <View style={styles.stack}>
      <View style={styles.actions}>
        <Action label="Reset to 4" onPress={() => setValue(4)} />
        <Action label="Clear" onPress={() => setValue(null)} />
      </View>
      <Field style={styles.field}>
        <FieldLabel style={styles.label}>Servings</FieldLabel>
        <NumberInput
          value={value}
          onValueChange={(next, details) => {
            setValue(next)
            log(`Value ${next ?? "empty"} (${details.reason})`)
          }}
          onValueCommit={(next, details) =>
            log(`Committed ${next ?? "empty"} (${details.reason})`)
          }
          min={1}
          max={12}
        >
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
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
})

export { Example }
