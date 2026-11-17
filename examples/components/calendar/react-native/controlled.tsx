import {
  Calendar,
  CalendarDay,
  type CalendarDayState,
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
  type CalendarStepState,
  type CalendarValue,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
} from "@ui-sdk/react-native/calendar"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const [value, setValue] = useState<CalendarValue>("2026-10-16")
  const [month, setMonth] = useState("2026-10")
  const log = useLog()

  return (
    <Calendar
      value={value}
      onValueChange={(next, details) => {
        setValue(next)
        log(`Selected ${String(next)} (${details.reason})`)
      }}
      month={month}
      onMonthChange={(next, details) => {
        setMonth(next)
        log(`Showing ${next} (${details.reason})`)
      }}
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
          {(index) => <CalendarWeekday index={index} style={styles.weekday} />}
        </CalendarWeekdays>
        <CalendarWeeks>
          {(cell) => <CalendarDay value={cell.date} style={dayStyle} />}
        </CalendarWeeks>
      </CalendarGrid>
    </Calendar>
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
