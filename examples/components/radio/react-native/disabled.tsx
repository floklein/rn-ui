import { Radio, RadioGroup, RadioIndicator } from "@ui-sdk/react-native/radio"
import { StyleSheet, Text, View } from "react-native"

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
]

const backups = [
  { value: "hourly", label: "Hourly", disabled: true },
  { value: "daily", label: "Daily", disabled: false },
  { value: "weekly", label: "Weekly", disabled: false },
]

function Example() {
  return (
    <View style={styles.sections}>
      <View style={styles.stack}>
        <Text style={styles.heading}>Theme</Text>
        <Text style={styles.hint}>Set by your organization.</Text>
        <RadioGroup
          aria-label="Theme"
          defaultValue="light"
          disabled
          style={styles.stack}
        >
          {themes.map((theme) => (
            <Radio key={theme.value} value={theme.value} style={styles.row}>
              {(state) => (
                <>
                  <View
                    style={[
                      styles.circle,
                      state.checked && styles.circleChecked,
                      state.disabled && styles.disabled,
                    ]}
                  >
                    <RadioIndicator style={styles.dot} />
                  </View>
                  <Text
                    style={[styles.label, state.disabled && styles.disabled]}
                  >
                    {theme.label}
                  </Text>
                </>
              )}
            </Radio>
          ))}
        </RadioGroup>
      </View>
      <View style={styles.stack}>
        <Text style={styles.heading}>Backups</Text>
        <Text style={styles.hint}>Hourly backups need the Pro plan.</Text>
        <RadioGroup
          aria-label="Backups"
          defaultValue="daily"
          style={styles.stack}
        >
          {backups.map((backup) => (
            <Radio
              key={backup.value}
              value={backup.value}
              disabled={backup.disabled}
              style={styles.row}
            >
              {(state) => (
                <>
                  <View
                    style={[
                      styles.circle,
                      state.checked && styles.circleChecked,
                      state.disabled && styles.disabled,
                    ]}
                  >
                    <RadioIndicator style={styles.dot} />
                  </View>
                  <Text
                    style={[styles.label, state.disabled && styles.disabled]}
                  >
                    {backup.label}
                  </Text>
                </>
              )}
            </Radio>
          ))}
        </RadioGroup>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sections: { gap: 24 },
  stack: { gap: 12 },
  heading: { fontSize: 17, fontWeight: "600" },
  hint: { fontSize: 14, color: "#71717a" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#a1a1aa",
    alignItems: "center",
    justifyContent: "center",
  },
  circleChecked: { borderColor: "#16a34a" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#16a34a" },
  label: { fontSize: 16 },
  disabled: { opacity: 0.5 },
})

export { Example }
