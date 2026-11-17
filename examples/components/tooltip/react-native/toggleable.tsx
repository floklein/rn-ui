import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ui-sdk/react-native/tooltip"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Storage</Text>
      <Tooltip toggleable>
        <TooltipTrigger aria-label="About storage" style={styles.icon}>
          <Text style={styles.glyph}>i</Text>
        </TooltipTrigger>
        <TooltipContent style={styles.content}>
          <Text style={styles.text}>Files in the trash still use storage.</Text>
        </TooltipContent>
      </Tooltip>
      <Text style={styles.hint}>12.4 of 15 GB used</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 14, fontWeight: "500" },
  hint: { fontSize: 14, color: "#71717a" },
  icon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#d4d4d8",
  },
  glyph: { fontSize: 13, fontWeight: "600" },
  content: {
    maxWidth: 240,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#18181b",
  },
  text: { fontSize: 13, color: "#fafafa" },
})

export { Example }
