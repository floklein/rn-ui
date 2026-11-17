import {
  DateInput,
  DateInputSegment,
  type DateInputState,
} from "@ui-sdk/react-native/date-input"
import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import { StyleSheet } from "react-native"

const inputStyle = (state: DateInputState) => [
  styles.input,
  state.invalid && styles.invalid,
  state.disabled && styles.disabled,
]

function Example() {
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Start date</FieldLabel>
      <DateInput defaultValue="2026-11-02" style={inputStyle}>
        {({ segments }) =>
          segments.map((segment) =>
            segment.editable ? (
              <DateInputSegment
                key={segment.key}
                segment={segment}
                style={styles.segment}
              />
            ) : (
              <DateInputSegment
                key={segment.key}
                segment={segment}
                style={styles.literal}
              >
                –
              </DateInputSegment>
            )
          )
        }
      </DateInput>
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
