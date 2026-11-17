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
} from "@ui-sdk/react-native/calendar"
import { Pressable, StyleSheet, Text, View } from "react-native"

function isoWeek(date: string) {
  const day = new Date(`${date}T00:00:00Z`)
  day.setUTCDate(day.getUTCDate() + 3 - ((day.getUTCDay() + 6) % 7))
  const firstThursday = new Date(Date.UTC(day.getUTCFullYear(), 0, 4))
  const days = (day.getTime() - firstThursday.getTime()) / 86400000
  return 1 + Math.round((days - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
}

function Example() {
  return (
    <Calendar
      defaultValue="2026-10-16"
      weekStartsOn={1}
      style={styles.calendar}
    >
      <View style={styles.header}>
        <CalendarPrevious
          style={stepStyle}
          render={(props, step) => (
            <Pressable {...props} accessibilityHint={`Shows ${step.month}`} />
          )}
        >
          <Text style={styles.stepLabel}>‹</Text>
        </CalendarPrevious>
        <CalendarHeading style={styles.heading}>
          {(heading) => heading.label}
        </CalendarHeading>
        <CalendarNext style={stepStyle}>
          <Text style={styles.stepLabel}>›</Text>
        </CalendarNext>
      </View>
      <CalendarGrid>
        {(grid) => (
          <>
            <View style={styles.row}>
              <Text accessibilityLabel="Week" style={styles.week}>
                Wk
              </Text>
              {grid.weekdays.map((weekday, index) => (
                <CalendarWeekday
                  key={weekday}
                  index={index}
                  style={styles.weekday}
                />
              ))}
            </View>
            {grid.weeks.map((week) => (
              <View key={week[0]!.date} style={styles.row}>
                <Text style={styles.week}>{isoWeek(week[0]!.date)}</Text>
                {week.map((cell) =>
                  cell.hidden ? (
                    <View key={cell.date} style={styles.empty} />
                  ) : (
                    <CalendarDay
                      key={cell.date}
                      value={cell.date}
                      style={dayStyle}
                    />
                  )
                )}
              </View>
            ))}
          </>
        )}
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
  row: { flexDirection: "row", alignItems: "center" },
  week: { width: 32, textAlign: "center", fontSize: 12, color: "#71717a" },
  empty: { flex: 1 },
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
