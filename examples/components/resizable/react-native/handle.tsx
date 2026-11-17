import {
  Resizable,
  ResizableHandle,
  ResizablePanel,
} from "@ui-sdk/react-native/resizable"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <Resizable style={styles.group}>
      <ResizablePanel defaultSize={35} minSize={20} style={styles.panel}>
        <Text style={styles.title}>Channels</Text>
        <Text style={styles.item}>general</Text>
        <Text style={styles.item}>design</Text>
        <Text style={styles.item}>releases</Text>
      </ResizablePanel>
      <ResizableHandle
        aria-label="Resize channels"
        hitSlop={8}
        style={styles.handle}
      >
        {(state) => (
          <View style={[styles.grip, state.dragging && styles.dragging]} />
        )}
      </ResizableHandle>
      <ResizablePanel defaultSize={65} minSize={20} style={styles.panel}>
        <Text style={styles.title}>general</Text>
        <Text style={styles.hint}>
          Kofi Mensah: The release notes are ready.
        </Text>
      </ResizablePanel>
    </Resizable>
  )
}

const styles = StyleSheet.create({
  group: {
    width: 320,
    height: 200,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    overflow: "hidden",
  },
  panel: { padding: 12, gap: 4 },
  title: { fontSize: 15, fontWeight: "600" },
  item: { fontSize: 14 },
  hint: { color: "#71717a", fontSize: 13 },
  handle: {
    width: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f5",
  },
  grip: { width: 4, height: 32, borderRadius: 2, backgroundColor: "#a1a1aa" },
  dragging: { backgroundColor: "#18181b" },
})

export { Example }
