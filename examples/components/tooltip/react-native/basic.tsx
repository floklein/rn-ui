import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ui-sdk/react-native/tooltip"
import { StyleSheet, Text } from "react-native"

function Example() {
  return (
    <Tooltip defaultOpen>
      <TooltipTrigger aria-label="Add to library" style={styles.icon}>
        <Text style={styles.glyph}>+</Text>
      </TooltipTrigger>
      <TooltipContent style={styles.content}>
        <Text style={styles.text}>Add to library</Text>
      </TooltipContent>
    </Tooltip>
  )
}

const styles = StyleSheet.create({
  icon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  glyph: { fontSize: 16 },
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
