import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  createNumberInputController,
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
  const [zoom] = useState(createNumberInputController)

  return (
    <View style={styles.stack}>
      <View style={styles.actions}>
        <Action
          label="Zoom Out"
          onPress={() => zoom.decrement({ large: true })}
        />
        <Action
          label="Zoom In"
          onPress={() => zoom.increment({ large: true })}
        />
        <Action label="Actual Size" onPress={() => zoom.setValue(100)} />
        <Action
          label="Read"
          onPress={() => log(`Zoom is ${zoom.getValue()}%`)}
        />
        <Action label="Focus" onPress={() => zoom.focus()} />
      </View>
      <Field style={styles.field}>
        <FieldLabel style={styles.label}>Zoom</FieldLabel>
        <NumberInput
          defaultValue={100}
          min={10}
          max={400}
          step={10}
          format={{ style: "unit", unit: "percent" }}
          controller={zoom}
          onValueChange={(value, details) =>
            log(`Zoom ${value ?? "empty"}% (${details.reason})`)
          }
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
