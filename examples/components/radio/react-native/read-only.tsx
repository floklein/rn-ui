import { Radio, RadioGroup, RadioIndicator } from "@ui-sdk/react-native/radio"
import { StyleSheet, Text, View } from "react-native"

const plans = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "team", label: "Team" },
]

function Example() {
  return (
    <View style={styles.stack}>
      <Text style={styles.heading}>Your plan</Text>
      <Text style={styles.hint}>Ask an admin to change plans.</Text>
      <RadioGroup
        aria-label="Your plan"
        defaultValue="pro"
        readOnly
        style={styles.stack}
      >
        {plans.map((plan) => (
          <Radio
            key={plan.value}
            value={plan.value}
            aria-label={plan.label}
            aria-description="Ask an admin to change plans."
            style={styles.row}
          >
            {(state) => (
              <>
                <View
                  style={[styles.circle, state.checked && styles.circleChecked]}
                >
                  <RadioIndicator style={styles.dot} />
                </View>
                <Text style={styles.label}>{plan.label}</Text>
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
})

export { Example }
