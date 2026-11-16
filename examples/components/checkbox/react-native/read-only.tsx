import { Checkbox, CheckboxIndicator } from "@ui-sdk/react-native/checkbox"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <Checkbox
      defaultChecked
      readOnly
      aria-label="Require two-factor authentication"
      aria-description="Your organization requires this setting."
      style={styles.row}
    >
      {(state) => (
        <>
          <View style={[styles.box, state.checked && styles.boxChecked]}>
            <CheckboxIndicator>
              <View style={styles.check} />
            </CheckboxIndicator>
          </View>
          <View style={styles.stack}>
            <Text style={styles.label}>Require two-factor authentication</Text>
            <Text style={styles.hint}>
              Your organization requires this setting.
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
  check: {
    width: 6,
    height: 11,
    marginTop: -2,
    borderColor: "#ffffff",
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  label: { fontSize: 16 },
  hint: { fontSize: 14, color: "#71717a" },
})

export { Example }
