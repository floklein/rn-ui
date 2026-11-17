import {
  DateInput,
  DateInputSegment,
  type DateInputState,
} from "@ui-sdk/react-native/date-input"
import { Field, FieldLabel } from "@ui-sdk/react-native/field"
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

const segments = ({ segments }: DateInputState) =>
  segments.map((segment) => (
    <DateInputSegment
      key={segment.key}
      segment={segment}
      style={segment.editable ? styles.segment : styles.literal}
    />
  ))

const inputStyle = (state: DateInputState) => [
  styles.input,
  state.invalid && styles.invalid,
  state.disabled && styles.disabled,
]

function Example() {
  const log = useLog()
  const [value, setValue] = useState<string | null>("2026-11-02")

  return (
    <View style={styles.stack}>
      <View style={styles.actions}>
        <Action label="Clear" onPress={() => setValue(null)} />
      </View>
      <Field style={styles.field}>
        <FieldLabel style={styles.label}>Due date</FieldLabel>
        <DateInput
          value={value}
          onValueChange={(next) => {
            setValue(next)
            log(`Due date ${next ?? "empty"}`)
          }}
          style={inputStyle}
        >
          {segments}
        </DateInput>
      </Field>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { alignSelf: "stretch", gap: 16 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  field: { alignSelf: "stretch", gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    height: 40,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  invalid: { borderColor: "#dc2626" },
  disabled: { opacity: 0.5 },
  segment: {
    minWidth: 24,
    paddingHorizontal: 2,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    color: "#18181b",
  },
  literal: { fontSize: 16, color: "#71717a" },
})

export { Example }
