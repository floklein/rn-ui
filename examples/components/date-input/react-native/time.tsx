import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  TimeInput,
  TimeInputSegment,
  type TimeInputState,
} from "@ui-sdk/react-native/time-input"
import { StyleSheet } from "react-native"

const timeSegments = ({ segments }: TimeInputState) =>
  segments.map((segment) => (
    <TimeInputSegment
      key={segment.key}
      segment={segment}
      style={segment.editable ? styles.segment : styles.literal}
    />
  ))

const timeInputStyle = (state: TimeInputState) => [
  styles.input,
  state.invalid && styles.invalid,
  state.disabled && styles.disabled,
]

function Example() {
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Meeting time</FieldLabel>
      <TimeInput defaultValue="09:30" style={timeInputStyle}>
        {timeSegments}
      </TimeInput>
    </Field>
  )
}

const styles = StyleSheet.create({
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
