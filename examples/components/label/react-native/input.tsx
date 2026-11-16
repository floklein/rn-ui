import { Input } from "@ui-sdk/react-native/input"
import { Label } from "@ui-sdk/react-native/label"
import { StyleSheet, View } from "react-native"

function Example() {
  return (
    <View style={styles.stack}>
      <Label htmlFor="shipping-city" style={styles.label}>
        Shipping city
      </Label>
      <Input id="shipping-city" placeholder="Lisbon" style={styles.input} />
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { alignSelf: "stretch", gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
})

export { Example }
