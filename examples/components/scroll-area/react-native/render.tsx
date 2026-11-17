import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  type ScrollAreaState,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@ui-sdk/react-native/scroll-area"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const tags = Array.from(
  { length: 50 },
  (_, index) => `v1.2.0-beta.${50 - index}`
)

function Example() {
  return (
    <ScrollArea render={<View style={styles.section} />}>
      {(state: ScrollAreaState) => (
        <>
          <ScrollAreaViewport
            render={<ScrollView style={styles.area} />}
            aria-label="Releases"
          >
            <ScrollAreaContent style={styles.content}>
              {tags.map((tag) => (
                <Text key={tag} style={styles.tag}>
                  {tag}
                </Text>
              ))}
            </ScrollAreaContent>
          </ScrollAreaViewport>
          <Text aria-hidden style={styles.hint}>
            {state.atStart
              ? "Scroll for older releases"
              : "More releases below"}
          </Text>
          <ScrollAreaScrollbar style={styles.scrollbar}>
            <ScrollAreaThumb style={styles.thumb} />
          </ScrollAreaScrollbar>
        </>
      )}
    </ScrollArea>
  )
}

const styles = StyleSheet.create({
  section: { width: 240, gap: 8 },
  area: {
    height: 260,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  content: { padding: 16, gap: 8 },
  tag: { fontSize: 14, fontVariant: ["tabular-nums"] },
  hint: { color: "#71717a", fontSize: 13 },
  scrollbar: { width: 10, padding: 2, bottom: 28 },
  thumb: { width: 6, borderRadius: 3, backgroundColor: "#a1a1aa" },
})

export { Example }
