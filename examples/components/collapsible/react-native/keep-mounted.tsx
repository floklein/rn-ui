import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@ui-sdk/react-native/collapsible"
import { StyleSheet, Text, TextInput } from "react-native"

function Example() {
  return (
    <Collapsible style={styles.card}>
      <CollapsibleTrigger style={styles.trigger}>
        <Text style={styles.title}>Add a delivery note</Text>
        <Text style={styles.hint}>Optional, for the courier</Text>
      </CollapsibleTrigger>
      <CollapsiblePanel keepMounted style={styles.panel}>
        <TextInput
          accessibilityLabel="Delivery note"
          multiline
          placeholder="Leave it with the front desk…"
          style={styles.input}
        />
      </CollapsiblePanel>
    </Collapsible>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 12 },
  trigger: { gap: 2, padding: 16 },
  title: { fontSize: 15, fontWeight: "500" },
  hint: { fontSize: 13, color: "#71717a" },
  panel: { paddingHorizontal: 16, paddingBottom: 16 },
  input: {
    minHeight: 80,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    textAlignVertical: "top",
  },
})

export { Example }
