import {
  CalendarDay,
  type CalendarDayState,
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
  type CalendarStepState,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
  DatePicker,
  DatePickerContent,
  DatePickerInput,
  type DatePickerInputState,
  DatePickerTrigger,
} from "@ui-sdk/react-native/date-picker"
import { useState } from "react"
import { type HostInstance, StyleSheet, Text, View } from "react-native"

function Example() {
  const [field, setField] = useState<HostInstance | null>(null)
  return (
    <DatePicker
      mode="range"
      months={2}
      monthFormat="short"
      defaultValue={["2026-10-12", "2026-10-16"]}
      style={styles.picker}
    >
      <View style={styles.row} ref={setField}>
        <DatePickerInput
          aria-label="Check in"
          placeholder="Check in"
          style={inputStyle}
        />
        <Text style={styles.hint}>–</Text>
        <DatePickerInput
          end
          aria-label="Check out"
          placeholder="Check out"
          style={inputStyle}
        />
        <DatePickerTrigger style={styles.icon}>
          <Text>📅</Text>
        </DatePickerTrigger>
      </View>
      <DatePickerContent anchor={field} align="center" style={styles.content}>
        <View style={styles.header}>
          <CalendarPrevious style={stepStyle}>
            <Text style={styles.stepLabel}>‹</Text>
          </CalendarPrevious>
          <CalendarHeading style={styles.heading} />
          <CalendarNext style={stepStyle}>
            <Text style={styles.stepLabel}>›</Text>
          </CalendarNext>
        </View>
        <View style={styles.months}>
          <CalendarGrid>
            <CalendarWeekdays>
              {(index) => (
                <CalendarWeekday index={index} style={styles.weekday} />
              )}
            </CalendarWeekdays>
            <CalendarWeeks>
              {(cell) => <CalendarDay value={cell.date} style={dayStyle} />}
            </CalendarWeeks>
          </CalendarGrid>
          <CalendarGrid offset={1}>
            <CalendarWeekdays>
              {(index) => (
                <CalendarWeekday index={index} style={styles.weekday} />
              )}
            </CalendarWeekdays>
            <CalendarWeeks>
              {(cell) => <CalendarDay value={cell.date} style={dayStyle} />}
            </CalendarWeeks>
          </CalendarGrid>
        </View>
      </DatePickerContent>
    </DatePicker>
  )
}

const inputStyle = (state: DatePickerInputState) => [
  styles.input,
  state.invalid && styles.invalid,
]

const stepStyle = (state: CalendarStepState) => [
  styles.step,
  state.disabled && styles.muted,
]

const dayStyle = (state: CalendarDayState) => [
  styles.day,
  state.inRange && styles.inRange,
  state.today && styles.today,
  state.selected && styles.selected,
  (state.outside || state.disabled) && styles.muted,
]

const styles = StyleSheet.create({
  picker: { gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  input: {
    width: 140,
    height: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  invalid: { borderColor: "#dc2626" },
  icon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  hint: { fontSize: 12, color: "#71717a" },
  content: {
    width: 308,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  header: { flexDirection: "row", alignItems: "center" },
  heading: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "600" },
  step: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  stepLabel: { fontSize: 22 },
  weekday: { flex: 1, textAlign: "center", fontSize: 12, color: "#71717a" },
  day: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  inRange: { backgroundColor: "#f4f4f5" },
  today: { borderWidth: 1, borderColor: "#a1a1aa" },
  selected: { backgroundColor: "#dbeafe" },
  muted: { opacity: 0.4 },
  months: { gap: 16 },
})

export { Example }
