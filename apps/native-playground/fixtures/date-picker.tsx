import {
  CalendarDay,
  type CalendarDayState,
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
  createDatePickerController,
  DatePicker,
  DatePickerClear,
  DatePickerContent,
  DatePickerHint,
  DatePickerInput,
  type DatePickerInputState,
  DatePickerTrigger,
} from "@ui-sdk/react-native/date-picker"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const dayStyle = (state: CalendarDayState) => [
  styles.day,
  state.today && styles.today,
  state.selected && styles.selected,
  (state.outside || state.disabled) && styles.muted,
]

const inputStyle = (state: DatePickerInputState) => [
  styles.input,
  state.invalid && styles.invalid,
]

function Fixture() {
  const [value, setValue] = useState("none")
  const [open, setOpen] = useState("none")
  const [picker] = useState(() => createDatePickerController())

  return (
    <View style={styles.fixture}>
      <Text testID="value-readout">{value}</Text>
      <Text testID="open-readout">{open}</Text>
      <Pressable
        accessibilityRole="button"
        testID="set-christmas"
        onPress={() => picker.setValue("2026-12-25")}
        style={styles.action}
      >
        <Text>Choose Christmas</Text>
      </Pressable>
      <DatePicker
        controller={picker}
        locale="en-US"
        today="2026-10-01"
        defaultValue="2026-10-16"
        unavailable={["2026-10-08"]}
        onValueChange={(next, details) =>
          setValue(`${String(next)}:${details.reason}:${details.source}`)
        }
        onOpenChange={(next, details) =>
          setOpen(`${next}:${details.reason}:${details.source}`)
        }
        style={styles.picker}
      >
        <View style={styles.row}>
          <DatePickerInput
            testID="input"
            aria-label="Due date"
            style={inputStyle}
          />
          <DatePickerClear
            testID="clear"
            aria-label="Clear date"
            style={styles.icon}
          >
            <Text>✕</Text>
          </DatePickerClear>
          <DatePickerTrigger testID="trigger" style={styles.icon}>
            <Text>📅</Text>
          </DatePickerTrigger>
        </View>
        <DatePickerHint testID="hint" />
        <DatePickerContent testID="content" style={styles.content}>
          <View style={styles.header}>
            <CalendarPrevious testID="previous" style={styles.step}>
              <Text>‹</Text>
            </CalendarPrevious>
            <CalendarHeading testID="heading" style={styles.heading} />
            <CalendarNext testID="next" style={styles.step}>
              <Text>›</Text>
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
      <Text testID="under">Under the popup</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
  picker: { gap: 4 },
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
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: 308,
    padding: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  header: { flexDirection: "row", alignItems: "center" },
  heading: { flex: 1, textAlign: "center", fontWeight: "600" },
  step: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  weekday: { flex: 1, textAlign: "center", color: "#52525b" },
  day: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  today: { borderWidth: 1, borderColor: "#a1a1aa" },
  selected: { backgroundColor: "#dbeafe" },
  muted: { opacity: 0.4 },
})

export { Fixture }
