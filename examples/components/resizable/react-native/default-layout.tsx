import {
  Resizable,
  ResizableHandle,
  type ResizableHandleState,
  ResizablePanel,
} from "@ui-sdk/react-native/resizable"
import { StyleSheet, Text } from "react-native"

function Example() {
  return (
    <Resizable defaultLayout={[25, 35, 40]} style={styles.group}>
      <ResizablePanel minSize={15} style={styles.panel}>
        <Text style={styles.title}>Mail</Text>
        <Text style={styles.item}>Inbox</Text>
        <Text style={styles.item}>Drafts</Text>
        <Text style={styles.item}>Sent</Text>
      </ResizablePanel>
      <ResizableHandle
        aria-label="Resize folders"
        hitSlop={8}
        style={handleStyle}
      />
      <ResizablePanel minSize={15} style={styles.panel}>
        <Text style={styles.title}>Inbox</Text>
        <Text style={styles.item}>Hollis Grant</Text>
        <Text style={styles.item}>Inès Moreau</Text>
        <Text style={styles.item}>Kofi Mensah</Text>
      </ResizablePanel>
      <ResizableHandle
        aria-label="Resize inbox"
        hitSlop={8}
        style={handleStyle}
      />
      <ResizablePanel minSize={15} style={styles.panel}>
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
