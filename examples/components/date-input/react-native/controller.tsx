import {
  createDateInputController,
  DateInput,
  DateInputSegment,
  type DateInputState,
} from "@ui-sdk/react-native/date-input"
import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

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
  const [publish] = useState(createDateInputController)

  return (
    <View style={styles.stack}>
      <View style={styles.actions}>
        <Action
          label="Christmas"
          onPress={() => publish.setValue("2026-12-25")}
        />
        <Action label="Edit Year" onPress={() => publish.focus("year")} />
        <Action label="Clear" onPress={() => publish.clear()} />
      </View>
      <Field style={styles.field}>
        <FieldLabel style={styles.label}>Publish on</FieldLabel>
        <DateInput controller={publish} style={inputStyle}>
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
    height: 44,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  invalid: { borderColor: "#dc2626" },
  disabled: { opacity: 0.5 },
  segment: {
    alignSelf: "stretch",
    minWidth: 44,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    color: "#18181b",
  },
  literal: { fontSize: 16, color: "#71717a" },
})

export { Example }
