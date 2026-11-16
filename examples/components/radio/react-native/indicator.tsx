import { Radio, RadioGroup, RadioIndicator } from "@ui-sdk/react-native/radio"
import { StyleSheet, Text, View } from "react-native"

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
]

function Example() {
  return (
    <View style={styles.stack}>
      <Text style={styles.heading}>Theme</Text>
      <RadioGroup aria-label="Theme" defaultValue="system" style={styles.stack}>
        {themes.map((theme) => (
          <Radio key={theme.value} value={theme.value} style={styles.row}>
            <View style={styles.circle}>
              <RadioIndicator
                keepMounted
                style={(state) => [styles.dot, !state.checked && styles.hidden]}
              />
            </View>
            <Text style={styles.label}>{theme.label}</Text>
          </Radio>
        ))}
      </RadioGroup>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  heading: { fontSize: 17, fontWeight: "600" },
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
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#16a34a" },
  hidden: { transform: [{ scale: 0 }] },
  label: { fontSize: 16 },
})

export { Example }
