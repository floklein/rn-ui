import { Checkbox, CheckboxIndicator } from "@ui-sdk/react-native/checkbox"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.stack}>
      <Checkbox defaultChecked style={styles.row}>
        {(state) => (
          <>
            <View style={[styles.box, state.checked && styles.boxChecked]}>
              <CheckboxIndicator>
                <Text style={styles.mark}>✓</Text>
              </CheckboxIndicator>
            </View>
            <Text style={styles.label}>Product updates</Text>
          </>
        )}
      </Checkbox>
      <Checkbox
        defaultChecked
        disabled
        style={(state) => [styles.row, state.disabled && styles.disabled]}
      >
        {(state) => (
          <>
            <View style={[styles.box, state.checked && styles.boxChecked]}>
              <CheckboxIndicator>
                <Text style={styles.mark}>✓</Text>
              </CheckboxIndicator>
            </View>
            <Text style={styles.label}>Security alerts</Text>
          </>
        )}
      </Checkbox>
    </View>
  )
}

const styles = StyleSheet.create({
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

  stack: { gap: 12 },
  disabled: { opacity: 0.5 },
})

export { Example }
