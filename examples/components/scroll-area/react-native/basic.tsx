import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@ui-sdk/react-native/scroll-area"
import { StyleSheet, Text } from "react-native"

const tags = Array.from(
  { length: 50 },
  (_, index) => `v1.2.0-beta.${50 - index}`
)

function Example() {
  return (
    <ScrollArea style={styles.area}>
      <ScrollAreaViewport aria-label="Tags">
        <ScrollAreaContent style={styles.content}>
          <Text role="heading" style={styles.heading}>
            Tags
          </Text>
          {tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </ScrollAreaContent>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar style={styles.scrollbar}>
        <ScrollAreaThumb style={styles.thumb} />
      </ScrollAreaScrollbar>
    </ScrollArea>
  )
}

const styles = StyleSheet.create({
  area: {
    width: 240,
    height: 280,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    overflow: "hidden",
  },
  content: { padding: 16, gap: 8 },
  heading: { fontSize: 15, fontWeight: "600" },
  tag: { fontSize: 14, fontVariant: ["tabular-nums"] },
  scrollbar: { width: 10, padding: 2 },
  thumb: { width: 6, borderRadius: 3, backgroundColor: "#a1a1aa" },
})

export { Example }
