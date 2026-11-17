import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  TimeInput,
  TimeInputSegment,
  type TimeInputState,
} from "@ui-sdk/react-native/time-input"
import { StyleSheet, View } from "react-native"

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
    <View style={styles.stack}>
      <Field style={styles.field}>
        <FieldLabel style={styles.label}>12-hour clock</FieldLabel>
        <TimeInput hourCycle={12} defaultValue="18:45" style={timeInputStyle}>
          {timeSegments}
        </TimeInput>
      </Field>
      <Field style={styles.field}>
        <FieldLabel style={styles.label}>24-hour clock</FieldLabel>
        <TimeInput hourCycle={24} defaultValue="18:45" style={timeInputStyle}>
          {timeSegments}
        </TimeInput>
      </Field>
      <Field style={styles.field}>
        <FieldLabel style={styles.label}>With seconds</FieldLabel>
        <TimeInput
          granularity="second"
          hourCycle={24}
          defaultValue="18:45:30"
          style={timeInputStyle}
        >
          {timeSegments}
        </TimeInput>
      </Field>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { alignSelf: "stretch", gap: 16 },
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
