import { Checkbox, CheckboxIndicator } from "@ui-sdk/react-native/checkbox"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <Checkbox
      aria-label="Accept terms and conditions"
      aria-description="By pressing this checkbox, you agree to the terms and conditions."
      style={styles.row}
    >
      {(state) => (
        <>
          <View style={[styles.box, state.checked && styles.boxChecked]}>
            <CheckboxIndicator>
              <Text style={styles.mark}>✓</Text>
            </CheckboxIndicator>
          </View>
          <View style={styles.stack}>
            <Text style={styles.label}>Accept terms and conditions</Text>
            <Text style={styles.hint}>
              By pressing this checkbox, you agree to the terms and conditions.
            </Text>
          </View>
        </>
      )}
    </Checkbox>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stack: { gap: 4, flexShrink: 1 },
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
  hint: { fontSize: 14, color: "#71717a" },
})

export { Example }
