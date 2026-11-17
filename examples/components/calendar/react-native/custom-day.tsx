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
} from "@ui-sdk/react-native/calendar"
import { StyleSheet, Text, View } from "react-native"

const priceOf = (date: string) => 80 + ((Number(date.slice(8)) * 7) % 5) * 10

function Example() {
  return (
    <Calendar
      today="2026-10-16"
      defaultValue="2026-10-16"
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
            <CalendarWeekday index={index} style={styles.weekday}>
              {(state) => (
                <Text
                  style={
                    (state.weekday === 0 || state.weekday === 6) &&
                    styles.weekend
                  }
                >
                  {state.label}
                </Text>
              )}
            </CalendarWeekday>
          )}
        </CalendarWeekdays>
        <CalendarWeeks>
          {(cell) => (
            <CalendarDay value={cell.date} style={dayStyle}>
              {(state) => (
                <View style={styles.dayStack}>
                  <Text>{state.label}</Text>
                  {!state.outside && !state.disabled && (
                    <Text style={styles.price}>${priceOf(state.date)}</Text>
                  )}
                </View>
              )}
            </CalendarDay>
          )}
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
  weekend: { color: "#b91c1c" },
  dayStack: { alignItems: "center" },
  price: { fontSize: 10, color: "#71717a" },
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
