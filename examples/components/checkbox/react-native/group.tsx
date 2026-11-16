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
        defaultValue={["cheese"]}
        style={styles.stack}
      >
        {toppings.map((topping) => (
          <Checkbox
            key={topping.value}
            value={topping.value}
            style={styles.row}
          >
            {(state) => (
              <>
                <View style={[styles.box, state.checked && styles.boxChecked]}>
                  <CheckboxIndicator>
                    <Text style={styles.mark}>✓</Text>
                  </CheckboxIndicator>
                </View>
                <Text style={styles.label}>{topping.label}</Text>
              </>
            )}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
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
  mark: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  label: { fontSize: 16 },
})

export { Example }
