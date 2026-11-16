import { Radio, RadioGroup, RadioIndicator } from "@ui-sdk/react-native/radio"
import { StyleSheet, Text, View } from "react-native"

const periods = [
  { value: "monthly", label: "Monthly", price: "$12 per month" },
  { value: "yearly", label: "Yearly", price: "$120 per year" },
]

function Example() {
  return (
    <View style={styles.stack}>
      <Text accessibilityRole="header" style={styles.heading}>
        Billing period
      </Text>
      <Text style={styles.hint}>Yearly billing gets you two months free.</Text>
      <RadioGroup
        aria-label="Billing period"
        defaultValue="monthly"
        style={styles.stack}
      >
        {periods.map((period) => (
          <Radio key={period.value} value={period.value} style={styles.row}>
            {(state) => (
              <>
                <View
                  style={[styles.circle, state.checked && styles.circleChecked]}
                >
                  <RadioIndicator style={styles.dot} />
                </View>
                <Text style={styles.label}>{period.label}</Text>
                <Text style={styles.hint}>({period.price})</Text>
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
