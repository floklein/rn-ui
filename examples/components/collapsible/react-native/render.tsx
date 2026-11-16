import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@ui-sdk/react-native/collapsible"
import { Pressable, StyleSheet, Text, View } from "react-native"

const updates = [
  { label: "Out for delivery", time: "07:40" },
  { label: "Arrived at the local depot", time: "05:12" },
  { label: "Left the sorting center", time: "Wed 21:03" },
]

function Example() {
  return (
    <Collapsible style={styles.card}>
      <CollapsibleTrigger
        render={(props, state) => (
          <Pressable
            {...props}
            style={[styles.trigger, state.open && styles.open]}
          />
        )}
      >
        {(state) => (
          <>
            <Text style={styles.title}>Track parcel</Text>
            <Text style={styles.hint}>
              {state.open ? "3 updates" : "Arrives Thursday"}
            </Text>
          </>
        )}
      </CollapsibleTrigger>
      <CollapsiblePanel>
        {updates.map((update) => (
          <View key={update.label} style={styles.row}>
            <Text>{update.label}</Text>
            <Text style={styles.hint}>{update.time}</Text>
          </View>
        ))}
      </CollapsiblePanel>
    </Collapsible>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    overflow: "hidden",
  },
  trigger: { gap: 2, padding: 16 },
  open: { backgroundColor: "#f4f4f5" },
  title: { fontSize: 15, fontWeight: "500" },
  hint: { fontSize: 13, color: "#71717a" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
})

export { Example }
