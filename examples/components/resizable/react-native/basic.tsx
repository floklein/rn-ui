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
      <ResizablePanel defaultSize={35} minSize={20} style={styles.panel}>
        <Text style={styles.title}>Files</Text>
        <Text style={styles.item}>page.tsx</Text>
        <Text style={styles.item}>layout.tsx</Text>
        <Text style={styles.item}>globals.css</Text>
      </ResizablePanel>
      <ResizableHandle
        aria-label="Resize files"
        hitSlop={8}
        style={handleStyle}
      />
      <ResizablePanel defaultSize={65} minSize={40}>
        <Resizable orientation="vertical" style={styles.nested}>
          <ResizablePanel defaultSize={60} minSize={30} style={styles.panel}>
            <Text style={styles.title}>page.tsx</Text>
            <Text style={styles.hint}>Saved just now</Text>
          </ResizablePanel>
          <ResizableHandle
            aria-label="Resize editor"
            hitSlop={8}
            style={handleStyle}
          />
          <ResizablePanel defaultSize={40} minSize={30} style={styles.panel}>
            <Text style={styles.title}>Terminal</Text>
            <Text style={styles.hint}>Ready on port 3000</Text>
          </ResizablePanel>
        </Resizable>
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
  nested: { flex: 1 },
})

export { Example }
