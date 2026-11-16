import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@ui-sdk/react-native/field"
import { Input } from "@ui-sdk/react-native/input"
import { StyleSheet, View } from "react-native"

function Example() {
  return (
    <FieldSet style={styles.set}>
      <FieldLegend style={styles.legend}>Address</FieldLegend>
      <FieldDescription style={styles.description}>
        We need your address to deliver your order.
      </FieldDescription>
      <FieldGroup style={styles.group}>
        <Field style={styles.field}>
          <FieldLabel style={styles.label}>Street address</FieldLabel>
          <Input autoComplete="street-address" style={styles.input} />
        </Field>
        <View style={styles.row}>
          <Field style={[styles.field, styles.grow]}>
            <FieldLabel style={styles.label}>City</FieldLabel>
            <Input
              autoComplete="postal-address-locality"
              style={styles.input}
            />
          </Field>
          <Field style={[styles.field, styles.grow]}>
            <FieldLabel style={styles.label}>Postal code</FieldLabel>
            <Input autoComplete="postal-code" style={styles.input} />
          </Field>
        </View>
      </FieldGroup>
    </FieldSet>
  )
}

const styles = StyleSheet.create({
  set: { alignSelf: "stretch", gap: 8 },
  legend: { fontSize: 16, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  group: { gap: 16, marginTop: 8 },
  row: { flexDirection: "row", gap: 12 },
  field: { gap: 6 },
  grow: { flex: 1 },
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
