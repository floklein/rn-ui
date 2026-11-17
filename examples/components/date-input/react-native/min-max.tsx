import {
  DateInput,
  DateInputSegment,
  type DateInputState,
} from "@ui-sdk/react-native/date-input"
import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react-native/field"
import { StyleSheet } from "react-native"

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
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Check-in</FieldLabel>
      <DateInput
        min="2026-01-01"
        max="2026-12-31"
        defaultValue="2026-06-15"
        style={inputStyle}
      >
        {segments}
      </DateInput>
      <FieldDescription style={styles.hint}>Any day in 2026.</FieldDescription>
    </Field>
  )
}

const styles = StyleSheet.create({
  field: { alignSelf: "stretch", gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  hint: { fontSize: 13, color: "#71717a" },
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
