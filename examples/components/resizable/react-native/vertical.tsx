import {
  Resizable,
  ResizableHandle,
  type ResizableHandleState,
  ResizablePanel,
} from "@ui-sdk/react-native/resizable"
import { StyleSheet, Text } from "react-native"

function Example() {
  return (
    <Resizable orientation="vertical" style={styles.group}>
      <ResizablePanel defaultSize={45} minSize={25} style={styles.panel}>
        <Text style={styles.title}>Inbox</Text>
        <Text style={styles.hint}>3 unread messages</Text>
      </ResizablePanel>
      <ResizableHandle
        aria-label="Resize inbox"
        hitSlop={8}
        style={handleStyle}
      />
      <ResizablePanel defaultSize={55} minSize={25} style={styles.panel}>
        <Text style={styles.title}>Quarterly report</Text>
        <Text style={styles.hint}>From Hollis Grant</Text>
      </ResizablePanel>
    </Resizable>
  )
}

const handleStyle = (state: ResizableHandleState) => [
  state.orientation === "vertical" ? styles.rowHandle : styles.columnHandle,
  state.dragging && styles.dragging,
  state.disabled && styles.disabled,
]

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
  columnHandle: { width: 1, backgroundColor: "#d4d4d8" },
  rowHandle: { height: 1, backgroundColor: "#d4d4d8" },
  dragging: { backgroundColor: "#18181b" },
  disabled: { backgroundColor: "#f4f4f5" },
})

export { Example }
