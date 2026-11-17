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
  createDatePickerController,
  DatePicker,
  DatePickerContent,
  DatePickerHint,
  DatePickerInput,
  type DatePickerInputState,
  DatePickerTrigger,
} from "@ui-sdk/react-native/date-picker"
import { Pressable, StyleSheet, Text, View } from "react-native"

const controller = createDatePickerController()

function Example() {
  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <Pressable
          style={styles.button}
          onPress={() => controller.setValue("2026-12-25")}
        >
          <Text>Choose Christmas</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => controller.open()}>
          <Text>Open</Text>
        </Pressable>
      </View>
      <DatePicker
        controller={controller}
        defaultValue="2026-10-16"
        style={styles.picker}
      >
        <View style={styles.row}>
          <DatePickerInput aria-label="Due date" style={inputStyle} />
          <DatePickerTrigger style={styles.icon}>
            <Text>📅</Text>
          </DatePickerTrigger>
        </View>
        <DatePickerHint style={styles.hint} />
        <DatePickerContent style={styles.content}>
          <View style={styles.header}>
            <CalendarPrevious style={stepStyle}>
              <Text style={styles.stepLabel}>‹</Text>
            </CalendarPrevious>
            <CalendarHeading style={styles.heading} />
            <CalendarNext style={stepStyle}>
              <Text style={styles.stepLabel}>›</Text>
            </CalendarNext>
          </View>
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
        </DatePickerContent>
      </DatePicker>
    </View>
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
  stack: { gap: 12 },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
})

export { Example }
