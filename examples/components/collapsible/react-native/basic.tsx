import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@ui-sdk/react-native/collapsible"
import { StyleSheet, Text, View } from "react-native"

const items = [
  { name: "Linen shirt", price: "$48.00" },
  { name: "Canvas tote", price: "$18.00" },
  { name: "Wool socks", price: "$18.00" },
]

function Example() {
  return (
    <Collapsible style={styles.card}>
      <CollapsibleTrigger style={styles.trigger}>
        <Text style={styles.title}>Order #4189</Text>
        <Text style={styles.hint}>3 items, $84.00</Text>
      </CollapsibleTrigger>
      <CollapsiblePanel>
        {items.map((item) => (
          <View key={item.name} style={styles.row}>
            <Text>{item.name}</Text>
            <Text>{item.price}</Text>
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
  title: { fontSize: 15, fontWeight: "500" },
  hint: { fontSize: 13, color: "#71717a" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
})

export { Example }
