import { Radio, RadioGroup, RadioIndicator } from "@ui-sdk/react-native/radio"
import { StyleSheet, Text, View } from "react-native"

const plans = [
  {
    value: "hobby",
    label: "Hobby",
    description: "Free for personal projects.",
  },
  {
    value: "pro",
    label: "Pro",
    description: "$20 per month for growing teams.",
  },
  {
    value: "enterprise",
    label: "Enterprise",
    description: "Custom pricing and support.",
  },
]

function Example() {
  return (
    <View style={styles.stack}>
      <Text style={styles.heading}>Plan</Text>
      <RadioGroup aria-label="Plan" defaultValue="hobby" style={styles.stack}>
        {plans.map((plan) => (
          <Radio
            key={plan.value}
            value={plan.value}
            aria-label={plan.label}
            aria-description={plan.description}
            style={(state) => [
              styles.card,
              state.checked && styles.cardChecked,
            ]}
          >
            {(state) => (
              <>
                <View style={styles.text}>
                  <Text style={styles.label}>{plan.label}</Text>
                  <Text style={styles.hint}>{plan.description}</Text>
                </View>
                <View
                  style={[styles.circle, state.checked && styles.circleChecked]}
                >
                  <RadioIndicator style={styles.dot} />
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
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  cardChecked: { borderColor: "#16a34a", backgroundColor: "#f0fdf4" },
  text: { flex: 1, gap: 4 },
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
