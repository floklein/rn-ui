import {
  Checkbox,
  CheckboxGroup,
  CheckboxIndicator,
} from "@ui-sdk/react-native/checkbox"
import { StyleSheet, Text, View } from "react-native"

const toppings = [
  { value: "cheese", label: "Cheese" },
  { value: "mushrooms", label: "Mushrooms" },
  { value: "olives", label: "Olives" },
  { value: "peppers", label: "Peppers" },
]

function Example() {
  return (
    <View style={styles.stack}>
      <Text style={styles.heading}>Toppings</Text>
      <CheckboxGroup
        aria-label="Toppings"
        defaultValue={["cheese", "olives"]}
        allValues={toppings.map((topping) => topping.value)}
        style={styles.stack}
      >
        <Checkbox parent aria-label="Select all" style={styles.row}>
          {(state) => (
            <>
              <View style={[styles.box, state.checked && styles.boxChecked]}>
                <CheckboxIndicator>
                  <View
                    style={state.indeterminate ? styles.dash : styles.check}
                  />
                </CheckboxIndicator>
              </View>
              <Text style={styles.label}>Select all</Text>
            </>
          )}
        </Checkbox>
        <View style={styles.nested}>
          {toppings.map((topping) => (
            <Checkbox
              key={topping.value}
              value={topping.value}
              style={styles.row}
            >
              {(state) => (
                <>
                  <View
                    style={[styles.box, state.checked && styles.boxChecked]}
                  >
                    <CheckboxIndicator>
                      <View style={styles.check} />
                    </CheckboxIndicator>
                  </View>
                  <Text style={styles.label}>{topping.label}</Text>
                </>
              )}
            </Checkbox>
          ))}
        </View>
      </CheckboxGroup>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  nested: { gap: 12, paddingStart: 34 },
  heading: { fontSize: 17, fontWeight: "600" },
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
  dash: { width: 10, height: 2, backgroundColor: "#ffffff" },
  label: { fontSize: 16 },
})

export { Example }
