import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
  type ScrollAreaScrollbarState,
} from "@ui-sdk/react-native/scroll-area"
import { StyleSheet, Text, View } from "react-native"

const delays = [
  { value: 0, label: "No delay" },
  { value: 2000, label: "2000 ms delay" },
]

const tags = Array.from(
  { length: 20 },
  (_, index) => `v1.2.0-beta.${50 - index}`
)

function Example() {
  return (
    <View style={styles.grid}>
      {delays.map((delay) => (
        <View key={delay.value} style={styles.stack}>
          <Text style={styles.hint}>{delay.label}</Text>
          <ScrollArea
            type="scroll"
            scrollHideDelay={delay.value}
            style={styles.area}
          >
            <ScrollAreaViewport>
              <ScrollAreaContent style={styles.content}>
                {tags.map((tag) => (
                  <Text key={tag} style={styles.tag}>
                    {tag}
                  </Text>
                ))}
              </ScrollAreaContent>
            </ScrollAreaViewport>
            <ScrollAreaScrollbar style={scrollbarStyle}>
              <ScrollAreaThumb style={styles.thumb} />
            </ScrollAreaScrollbar>
          </ScrollArea>
        </View>
      ))}
    </View>
  )
}

const scrollbarStyle = (state: ScrollAreaScrollbarState) => [
  styles.scrollbar,
  !state.visible && styles.hidden,
]

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  stack: { gap: 8 },
  hint: { color: "#71717a", fontSize: 13 },
  area: {
    width: 150,
    height: 200,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    overflow: "hidden",
  },
  content: { padding: 12, gap: 6 },
  tag: { fontSize: 13, fontVariant: ["tabular-nums"] },
  scrollbar: { width: 10, padding: 2 },
  hidden: { opacity: 0 },
  thumb: { width: 6, borderRadius: 3, backgroundColor: "#a1a1aa" },
})

export { Example }
