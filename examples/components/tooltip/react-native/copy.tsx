import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ui-sdk/react-native/tooltip"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const command = "npm install @ui-sdk/react-native"

function Example() {
  const log = useLog()
  const [copied, setCopied] = useState(false)
  return (
    <View style={styles.row}>
      <Text style={styles.code}>{command}</Text>
      <Tooltip
        closeOnPress={false}
        onOpenChangeComplete={(open) => !open && setCopied(false)}
      >
        <TooltipTrigger
          aria-label={copied ? "Copied" : "Copy"}
          onPress={() => {
            log(`Copied “${command}”`)
            setCopied(true)
          }}
          style={styles.icon}
        >
          <Text style={styles.glyph}>{copied ? "✓" : "⧉"}</Text>
        </TooltipTrigger>
        <TooltipContent style={styles.content}>
          <Text style={styles.text}>{copied ? "Copied" : "Copy"}</Text>
        </TooltipContent>
      </Tooltip>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  code: { fontFamily: "Menlo", fontSize: 13 },
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
