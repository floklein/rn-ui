import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@ui-sdk/react-native/drawer"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const paragraphs = [
  "The drawer rises from any edge, rests on snap points and follows your finger with the same spring as a system sheet.",
  "Snap points take fractions of the screen, pixels, rem, percentages or the content's own size. Points that land within a pixel of each other merge into one.",
  "Dragging a list scrolls it until it reaches the top, and then the same gesture moves the drawer, so closing a long sheet never needs two tries.",
  "The handle steps through the snap points with a press, the arrow keys, Home and End. Screen readers on phones adjust it like a slider.",
  "Below a snap point you choose, the page behind stays usable and undimmed, like a map with a sheet of results.",
  "Drawers opened from inside each other stack, and the one beneath steps back while the new one rises.",
  "The on-screen keyboard pushes the drawer up, and the focused field scrolls into view inside it, never the page.",
  "With reduced motion, drawers fade in and out instead of sliding.",
]

function Example() {
  return (
    <Drawer>
      <DrawerTrigger style={styles.button}>
        <Text>Scrollable Content</Text>
      </DrawerTrigger>
      <DrawerBackdrop style={styles.backdrop} />
      <DrawerContent
        initialFocus="content"
        style={[styles.content, styles.tall]}
      >
        <View style={styles.grip} />
        <View style={styles.stack}>
          <DrawerTitle style={styles.title}>Release notes</DrawerTitle>
          <DrawerDescription style={styles.description}>
            Everything new in the drawer.
          </DrawerDescription>
        </View>
        <ScrollView contentContainerStyle={styles.paragraphs}>
          {paragraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.description}>
              {paragraph}
            </Text>
          ))}
        </ScrollView>
        <DrawerClose style={[styles.button, styles.solid, styles.wide]}>
          <Text style={styles.solidText}>Got It</Text>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  )
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  solid: { backgroundColor: "#18181b", borderColor: "#18181b" },
  solidText: { color: "#fafafa", fontWeight: "500" },
  backdrop: { position: "absolute", inset: 0, backgroundColor: "#00000033" },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#ffffff",
  },
  grip: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#d4d4d8",
  },
  stack: { gap: 6 },
  title: { fontSize: 17, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  wide: { alignSelf: "stretch", alignItems: "center" },
  tall: { maxHeight: "70%" },
  paragraphs: { gap: 12 },
})

export { Example }
