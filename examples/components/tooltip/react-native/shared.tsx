import {
  createTooltipController,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ui-sdk/react-native/tooltip"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"

const formats = [
  { glyph: "B", label: "Bold" },
  { glyph: "I", label: "Italic" },
  { glyph: "U", label: "Underline" },
]

function Example() {
  const [tooltip] = useState(() => createTooltipController<string>())
  return (
    <View style={styles.row} role="group" aria-label="Formatting">
      {formats.map((format) => (
        <TooltipTrigger
          key={format.label}
          controller={tooltip}
          payload={format.label}
          aria-label={format.label}
          style={styles.icon}
        >
          <Text style={styles.glyph}>{format.glyph}</Text>
        </TooltipTrigger>
      ))}
      <Tooltip controller={tooltip}>
        <TooltipContent<string> style={styles.content}>
          {(state) => <Text style={styles.text}>{state.payload}</Text>}
        </TooltipContent>
      </Tooltip>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 4 },
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
