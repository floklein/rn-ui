import { Button } from "@ui-sdk/react-native/button"
import { Separator } from "@ui-sdk/react-native/separator"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.stack}>
      <Button style={[styles.button, styles.solid]}>
        <Text style={styles.solidLabel}>Sign In with Passkey</Text>
      </Button>
      <View style={styles.row}>
        <Separator decorative style={styles.line} />
        <Text style={styles.hint}>or</Text>
        <Separator decorative style={styles.line} />
      </View>
      <Button style={styles.button}>
        <Text style={styles.label}>Email Me a Link</Text>
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12, width: 320, maxWidth: "100%" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: "#e4e4e7" },
  hint: { fontSize: 13, color: "#71717a" },
  button: {
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  solid: { backgroundColor: "#18181b", borderColor: "#18181b" },
  label: { fontSize: 15, fontWeight: "500" },
  solidLabel: { fontSize: 15, fontWeight: "500", color: "#ffffff" },
})

export { Example }
