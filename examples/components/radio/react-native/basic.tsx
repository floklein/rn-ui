import { Radio, RadioGroup, RadioIndicator } from "@ui-sdk/react-native/radio"
import { StyleSheet, Text, View } from "react-native"

const speeds = [
  { value: "standard", label: "Standard" },
  { value: "express", label: "Express" },
  { value: "overnight", label: "Overnight" },
]

function Example() {
  return (
    <View style={styles.stack}>
      <Text style={styles.heading}>Shipping speed</Text>
      <RadioGroup
        aria-label="Shipping speed"
        defaultValue="standard"
        style={styles.stack}
      >
        {speeds.map((speed) => (
          <Radio key={speed.value} value={speed.value} style={styles.row}>
            {(state) => (
              <>
                <View
                  style={[styles.circle, state.checked && styles.circleChecked]}
                >
                  <RadioIndicator style={styles.dot} />
                </View>
                <Text style={styles.label}>{speed.label}</Text>
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
