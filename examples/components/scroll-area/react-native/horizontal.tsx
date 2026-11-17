import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@ui-sdk/react-native/scroll-area"
import { StyleSheet, Text, View } from "react-native"

const swatches = [
  { name: "Sand", color: "#e6d8bf" },
  { name: "Clay", color: "#c98b6b" },
  { name: "Rust", color: "#a4502f" },
  { name: "Moss", color: "#7d8b5a" },
  { name: "Sage", color: "#b5c2a3" },
  { name: "Fog", color: "#c9d1d6" },
  { name: "Slate", color: "#5b6b78" },
  { name: "Ink", color: "#2b2f36" },
]

function Example() {
  return (
    <ScrollArea type="auto" style={styles.area}>
      <ScrollAreaViewport horizontal aria-label="Palette">
        <ScrollAreaContent style={styles.content}>
          {swatches.map((swatch) => (
            <View key={swatch.name} style={styles.item}>
              <View
                style={[styles.swatch, { backgroundColor: swatch.color }]}
              />
              <Text style={styles.name}>{swatch.name}</Text>
            </View>
          ))}
        </ScrollAreaContent>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar orientation="horizontal" style={styles.scrollbar}>
        <ScrollAreaThumb style={styles.thumb} />
      </ScrollAreaScrollbar>
    </ScrollArea>
  )
}

const styles = StyleSheet.create({
  area: {
    width: 300,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    overflow: "hidden",
  },
  content: { flexDirection: "row", gap: 12, padding: 16, paddingBottom: 20 },
  item: { alignItems: "center", gap: 6 },
  swatch: { width: 64, height: 64, borderRadius: 8 },
  name: { fontSize: 13 },
  scrollbar: { height: 10, padding: 2 },
  thumb: { height: 6, borderRadius: 3, backgroundColor: "#a1a1aa" },
})

export { Example }
