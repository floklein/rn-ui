import {
  Calendar,
  CalendarDay,
  type CalendarDayState,
  CalendarGrid,
  CalendarHeading,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
} from "@ui-sdk/react-native/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  type SelectItemState,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react-native/select"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((label, index) => ({ value: String(index + 1).padStart(2, "0"), label }))
const years = ["2024", "2025", "2026", "2027", "2028"].map((year) => ({
  value: year,
  label: year,
}))

function Example() {
  const [month, setMonth] = useState("2026-10")
  const [year, monthOfYear] = month.split("-")
  return (
    <Calendar
      month={month}
      onMonthChange={setMonth}
      defaultValue="2026-10-16"
      min="2024-01-01"
      max="2028-12-31"
      style={styles.calendar}
    >
      <View style={styles.header}>
        <CalendarHeading style={styles.heading} />
        <Picker
          label="Month"
          options={months}
          value={monthOfYear}
          onValueChange={(next) => setMonth(`${year}-${next}`)}
        />
        <Picker
          label="Year"
          options={years}
          value={year}
          onValueChange={(next) => setMonth(`${next}-${monthOfYear}`)}
        />
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

function Picker({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string
  options: { value: string; label: string; disabled?: boolean }[]
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => next && onValueChange(next)}
    >
      <SelectTrigger aria-label={label} style={styles.trigger}>
        <SelectValue />
        <Text aria-hidden style={styles.chevron}>
          ▾
        </Text>
      </SelectTrigger>
      <SelectContent
        style={(state) => [
          styles.content,
          { maxHeight: state.availableHeight },
        ]}
      >
        <ScrollView style={styles.scroll}>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              style={itemStyle}
            >
              <Text>{option.label}</Text>
              <SelectItemIndicator>
                <View style={styles.check} />
              </SelectItemIndicator>
            </SelectItem>
          ))}
        </ScrollView>
      </SelectContent>
    </Select>
  )
}

const itemStyle = (
  state: SelectItemState,
  { pressed }: { pressed: boolean }
) => [
  styles.item,
  (state.highlighted || pressed) && styles.highlighted,
  state.disabled && styles.muted,
]

const dayStyle = (state: CalendarDayState) => [
  styles.day,
  state.today && styles.today,
  state.selected && styles.selected,
  (state.outside || state.disabled) && styles.muted,
]

const styles = StyleSheet.create({
  calendar: { width: 308, gap: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  heading: { flex: 1, fontSize: 16, fontWeight: "600" },
  weekday: { flex: 1, textAlign: "center", fontSize: 12, color: "#71717a" },
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
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  chevron: { fontSize: 12, color: "#71717a" },
  content: {
    width: 160,
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  scroll: { flexGrow: 0 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  highlighted: { backgroundColor: "#f4f4f5" },
  check: {
    width: 6,
    height: 11,
    marginTop: -2,
    marginRight: 4,
    borderColor: "#18181b",
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
})

export { Example }
