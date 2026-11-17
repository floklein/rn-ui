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
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const locales = ["en-US", "de-DE", undefined] as const
const nextLabels = ["Use German", "Use Device Language", "Use English"]

const stepStyle = (state: CalendarStepState) => [
  styles.step,
  state.disabled && styles.muted,
]

const dayStyle = (state: CalendarDayState) => [
  styles.day,
  state.today && styles.today,
  state.selected && styles.selected,
  (state.outside || state.disabled) && styles.muted,
]

function Fixture() {
  const [value, setValue] = useState("none")
  const [month, setMonth] = useState("none")
  const [locale, setLocale] = useState(0)
  const [calendar] = useState(() => createCalendarController())

  return (
    <View style={styles.fixture}>
      <Text testID="value-readout">{value}</Text>
      <Text testID="month-readout">{month}</Text>
      <Text testID="device-locale">
        {Intl.DateTimeFormat().resolvedOptions().locale}
      </Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          testID="focus-christmas"
          onPress={() => calendar.focus("2026-12-25")}
          style={styles.action}
        >
          <Text>Focus Christmas</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="next-locale"
          onPress={() => setLocale((locale + 1) % locales.length)}
          style={styles.action}
        >
          <Text>{nextLabels[locale]}</Text>
        </Pressable>
      </View>
      <Calendar
        controller={calendar}
        locale={locales[locale]}
        today="2026-10-01"
        defaultValue="2026-10-16"
        unavailable={["2026-10-08"]}
        onValueChange={(next, details) =>
          setValue(`${String(next)}:${details.reason}:${details.source}`)
        }
        onMonthChange={(next, details) =>
          setMonth(`${next}:${details.reason}:${details.source}`)
        }
        style={styles.calendar}
      >
        <View style={styles.header}>
          <CalendarPrevious testID="previous" style={stepStyle}>
            <Text>‹</Text>
          </CalendarPrevious>
          <CalendarHeading testID="heading" style={styles.heading} />
          <CalendarNext testID="next" style={stepStyle}>
            <Text>›</Text>
          </CalendarNext>
        </View>
        <CalendarGrid>
          <CalendarWeekdays>
            {(index) => (
              <CalendarWeekday
                index={index}
                testID={`weekday-${index}`}
                style={styles.weekday}
              />
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

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  actions: { flexDirection: "row", gap: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
  calendar: { width: 308, gap: 4 },
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
