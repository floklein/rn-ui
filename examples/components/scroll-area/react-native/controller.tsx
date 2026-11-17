import {
  createScrollAreaController,
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@ui-sdk/react-native/scroll-area"
import { useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const tags = Array.from(
  { length: 50 },
  (_, index) => `v1.2.0-beta.${50 - index}`
)

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.action}
    >
      <Text>{label}</Text>
    </Pressable>
  )
}

function Example() {
  const log = useLog()
  const [controller] = useState(createScrollAreaController)
  const edge = useRef<string | null>("start")

  const read = () => {
    const next = controller.isAtEnd()
      ? "end"
      : controller.isAtStart()
        ? "start"
        : null
    if (next && next !== edge.current) {
      log(`At the ${next}`)
    }
    edge.current = next
  }

  return (
    <View style={styles.stack}>
      <View style={styles.actions}>
        <Action
          label="Back to Top"
          onPress={() => controller.scrollToStart({ behavior: "smooth" })}
        />
        <Action
          label="Jump to the End"
          onPress={() => controller.scrollToEnd({ behavior: "instant" })}
        />
      </View>
      <ScrollArea controller={controller} style={styles.area}>
        <ScrollAreaViewport aria-label="Tags" onScroll={read}>
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
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16, alignItems: "flex-start" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
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
