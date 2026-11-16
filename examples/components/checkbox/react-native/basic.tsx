import { Checkbox, CheckboxIndicator } from "@ui-sdk/react-native/checkbox"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <Checkbox style={styles.row}>
      {(state) => (
        <>
          <View style={[styles.box, state.checked && styles.boxChecked]}>
            <CheckboxIndicator>
              <View style={styles.check} />
            </CheckboxIndicator>
          </View>
          <Text style={styles.label}>Accept terms and conditions</Text>
        </>
      )}
    </Checkbox>
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
})

export { Example }
