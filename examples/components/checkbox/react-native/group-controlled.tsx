import {
  Checkbox,
  CheckboxGroup,
  CheckboxIndicator,
  createCheckboxGroupController,
} from "@ui-sdk/react-native/checkbox"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

type Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

const days: { value: Day; label: string }[] = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
  { value: "sun", label: "Sunday" },
]

const weekdays: Day[] = ["mon", "tue", "wed", "thu", "fri"]

function Example() {
  const log = useLog()
  const [schedule] = useState(() => createCheckboxGroupController<Day>())
  const [value, setValue] = useState<Day[]>(["mon", "tue"])

  return (
    <View style={styles.stack}>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          onPress={() => schedule.setValue(weekdays)}
          style={styles.button}
        >
          <Text>Select Weekdays</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => schedule.setValue([])}
          style={styles.button}
        >
          <Text>Clear</Text>
        </Pressable>
      </View>
      <Text style={styles.heading}>Working days</Text>
      <CheckboxGroup
        aria-label="Working days"
        value={value}
        onValueChange={(next, details) => {
          setValue(next)
          const names = days
            .filter((day) => next.includes(day.value))
            .map((day) => day.label)
          log(`${names.join(", ") || "No days"} (${details.reason})`)
        }}
        controller={schedule}
        style={styles.stack}
      >
        {days.map((day) => (
          <Checkbox key={day.value} value={day.value} style={styles.row}>
            {(state) => (
              <>
                <View style={[styles.box, state.checked && styles.boxChecked]}>
                  <CheckboxIndicator>
                    <Text style={styles.mark}>✓</Text>
                  </CheckboxIndicator>
                </View>
                <Text style={styles.label}>{day.label}</Text>
              </>
            )}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  controls: { flexDirection: "row", gap: 8 },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  heading: { fontSize: 17, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#a1a1aa",
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  mark: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  label: { fontSize: 16 },
})

export { Example }
