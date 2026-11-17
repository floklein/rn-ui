import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@ui-sdk/react-native/drawer"
import { StyleSheet, Text, View } from "react-native"

const sides = [
  {
    side: "top",
    label: "Top",
    title: "Notifications",
    description: "You're all caught up.",
  },
  {
    side: "right",
    label: "Right",
    title: "Cart",
    description: "2 items, $84.00.",
  },
  {
    side: "bottom",
    label: "Bottom",
    title: "Share",
    description: "Send this page to your team.",
  },
  {
    side: "left",
    label: "Left",
    title: "Menu",
    description: "Jump to a section of the docs.",
  },
] as const

function Example() {
  return (
    <View style={styles.row}>
      {sides.map(({ side, label, title, description }) => (
        <Drawer key={side} side={side}>
          <DrawerTrigger style={styles.button}>
            <Text>{label}</Text>
          </DrawerTrigger>
          <DrawerBackdrop style={styles.backdrop} />
          <DrawerContent style={[styles.panel, edges[side]]}>
            <View style={styles.stack}>
              <DrawerTitle style={styles.title}>{title}</DrawerTitle>
              <DrawerDescription style={styles.description}>
                {description}
              </DrawerDescription>
            </View>
            <DrawerClose style={[styles.button, styles.solid]}>
              <Text style={styles.solidText}>Close</Text>
            </DrawerClose>
          </DrawerContent>
        </Drawer>
      ))}
    </View>
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
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  panel: { gap: 16, padding: 20, paddingTop: 64, backgroundColor: "#ffffff" },
})

const edges = StyleSheet.create({
  top: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  right: { width: "80%", borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  bottom: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
  },
  left: { width: "80%", borderTopRightRadius: 16, borderBottomRightRadius: 16 },
})

export { Example }
