import {
  Resizable,
  ResizableHandle,
  type ResizableHandleState,
  ResizablePanel,
} from "@ui-sdk/react-native/resizable"
import { StyleSheet, Text } from "react-native"

function Example() {
  return (
    <Resizable style={styles.group}>
      <ResizablePanel defaultSize="140px" minSize="100px" maxSize="200px" style={styles.panel}>
        <Text style={styles.title}>Docs</Text>
        <Text style={styles.item}>Getting Started</Text>
        <Text style={styles.item}>Components</Text>
        <Text style={styles.item}>Guides</Text>
      </ResizablePanel>
      <ResizableHandle
        aria-label="Resize navigation"
        hitSlop={8}
        style={handleStyle}
      />
      <ResizablePanel minSize={30} style={styles.panel}>
        <Text style={styles.title}>Getting Started</Text>
        <Text style={styles.hint}>Install the packages</Text>
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
