import { Input, InputClear, InputGroup } from "@ui-sdk/react-native/input"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Website</Text>
      <InputGroup style={styles.group}>
        <Text style={styles.affix}>https://</Text>
        <Input
          aria-label="Website"
          placeholder="example.com"
          defaultValue="hollisgrant.com"
          autoCapitalize="none"
          keyboardType="url"
          onValueChange={(value, details) =>
            log(`${value ? `“${value}”` : "Empty"} (${details.reason})`)
          }
          style={styles.input}
        />
        <InputClear aria-label="Clear website" style={styles.clear}>
          <Text style={styles.affix}>×</Text>
        </InputClear>
      </InputGroup>
      <Text style={styles.hint}>Shown on your public profile.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  field: { alignSelf: "stretch", gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  group: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  affix: { fontSize: 16, color: "#71717a" },
  input: { flex: 1, paddingVertical: 10, fontSize: 16 },
  clear: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: { fontSize: 14, color: "#71717a" },
})

export { Example }
