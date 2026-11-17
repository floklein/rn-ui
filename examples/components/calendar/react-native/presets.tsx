import {
  Calendar,
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
  createCalendarController,
} from "@ui-sdk/react-native/calendar"
import { addDays, endOfMonth, startOfMonth } from "@ui-sdk/react-native/date"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const today = "2026-10-16"
const presets = [
  { label: "Last 7 Days", range: [addDays(today, -6), today] },
  { label: "This Month", range: [startOfMonth(today), endOfMonth(today)] },
  { label: "Next 30 Days", range: [today, addDays(today, 29)] },
] as const

function Example() {
  const [calendar] = useState(() => createCalendarController())

  return (
    <View style={styles.stack}>
      <View style={styles.controls}>
        {presets.map((preset) => (
          <Pressable
            key={preset.label}
            accessibilityRole="button"
            onPress={() => {
              calendar.setValue([...preset.range])
              calendar.focus(preset.range[0])
            }}
            style={styles.button}
          >
            <Text>{preset.label}</Text>
          </Pressable>
        ))}
      </View>
      <Calendar
        mode="range"
        controller={calendar}
        today={today}
        defaultMonth="2026-10"
        style={styles.calendar}
      >
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
      </Calendar>
    </View>
  )
}

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
  stack: { gap: 12 },
  controls: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  calendar: { width: 308, gap: 8 },
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
})

export { Example }
