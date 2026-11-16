import { Radio, RadioGroup, RadioIndicator } from "@ui-sdk/react-native/radio"
import { StyleSheet, Text, View } from "react-native"

const frequencies = [
  { value: "instant", label: "Instantly", description: "An email right away." },
  {
    value: "daily",
    label: "Daily digest",
    description: "One email each morning.",
  },
  {
    value: "weekly",
    label: "Weekly digest",
    description: "A summary every Monday.",
  },
]

function Example() {
  return (
    <View style={styles.stack}>
      <Text style={styles.heading}>Email notifications</Text>
      <RadioGroup
        aria-label="Email notifications"
        defaultValue="daily"
        style={styles.stack}
      >
        {frequencies.map((frequency) => (
          <Radio
            key={frequency.value}
            value={frequency.value}
            aria-label={frequency.label}
            aria-description={frequency.description}
            style={styles.row}
          >
            {(state) => (
              <>
                <View
                  style={[styles.circle, state.checked && styles.circleChecked]}
                >
                  <RadioIndicator style={styles.dot} />
                </View>
                <View style={styles.text}>
                  <Text style={styles.label}>{frequency.label}</Text>
                  <Text style={styles.hint}>{frequency.description}</Text>
                </View>
              </>
            )}
          </Radio>
        ))}
      </RadioGroup>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  heading: { fontSize: 17, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  text: { gap: 4, flexShrink: 1 },
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
  hint: { fontSize: 14, color: "#71717a" },
})

export { Example }
