import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ui-sdk/react-native/tooltip"
import { useRef } from "react"
import { StyleSheet, Text, View } from "react-native"

const files = [
  "Quarterly report, final revised version for the board.pdf",
  "Notes.txt",
  "Design review recording, October 2nd.mp4",
  "Budget.xlsx",
]

function FileRow({ name }: { name: string }) {
  const widths = useRef({ shown: 0, full: 0 })
  return (
    <View style={styles.row}>
      <Tooltip
        type="label"
        onOpenChange={(open, details) => {
          const { shown, full } = widths.current
          if (open && full <= shown) {
            details.cancel()
          }
        }}
      >
        <TooltipTrigger style={styles.file}>
          <Text style={styles.glyph}>▯</Text>
          <Text
            numberOfLines={1}
            onLayout={(event) => {
              widths.current.shown = event.nativeEvent.layout.width
            }}
            style={styles.name}
          >
            {name}
          </Text>
        </TooltipTrigger>
        <TooltipContent style={styles.content}>
          <Text style={styles.text}>{name}</Text>
        </TooltipContent>
      </Tooltip>
      <Text
        numberOfLines={1}
        aria-hidden
        onTextLayout={(event) => {
          widths.current.full = event.nativeEvent.lines[0]?.width ?? 0
        }}
        style={styles.measure}
      >
        {name}
      </Text>
    </View>
  )
}

function Example() {
  return (
    <View style={styles.list}>
      {files.map((file) => (
        <FileRow key={file} name={file} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { width: 240, gap: 4 },
  row: { overflow: "hidden" },
  file: { flexDirection: "row", alignItems: "center", gap: 6, padding: 6 },
  glyph: { fontSize: 14 },
  name: { flexShrink: 1, fontSize: 14 },
  measure: { position: "absolute", width: 10000, opacity: 0, fontSize: 14 },
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
