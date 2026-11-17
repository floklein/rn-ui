import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ui-sdk/react-native/tooltip"
import { StyleSheet, Text, View } from "react-native"

const sides = [
  { side: "top", label: "Top" },
  { side: "left", label: "Left" },
  { side: "right", label: "Right" },
  { side: "bottom", label: "Bottom" },
] as const

function Example() {
  return (
    <View style={styles.grid}>
      {sides.map(({ side, label }) => (
        <Tooltip key={side}>
          <TooltipTrigger style={styles.button}>
            <Text>{label}</Text>
          </TooltipTrigger>
          <TooltipContent side={side} style={styles.content}>
            <Text style={styles.text}>Add to library</Text>
          </TooltipContent>
        </Tooltip>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
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
