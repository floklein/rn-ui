import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  type ScrollAreaScrollbarState,
  ScrollAreaThumb,
  type ScrollAreaType,
  ScrollAreaViewport,
} from "@ui-sdk/react-native/scroll-area"
import { StyleSheet, Text, View } from "react-native"

const types: ScrollAreaType[] = ["hover", "scroll", "auto", "always"]

const tags = Array.from(
  { length: 20 },
  (_, index) => `v1.2.0-beta.${50 - index}`
)

function Example() {
  return (
    <View style={styles.grid}>
      {types.map((type) => (
        <View key={type} style={styles.stack}>
          <Text style={styles.code}>type="{type}"</Text>
          <ScrollArea type={type} style={styles.area}>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16, maxWidth: 340 },
  stack: { gap: 8 },
  code: { fontFamily: "Menlo", fontSize: 12 },
  area: {
    width: 150,
    height: 160,
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
