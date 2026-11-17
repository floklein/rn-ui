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
      <FieldLabel style={styles.label}>Delivery date</FieldLabel>
      <DateInput
        defaultValue="2026-11-02"
        unavailable={{ weekday: [0, 6] }}
        style={inputStyle}
      >
        {segments}
      </DateInput>
      <FieldDescription style={styles.hint}>
        We deliver Monday to Friday.
      </FieldDescription>
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
