import {
  Resizable,
  ResizableHandle,
  type ResizableHandleState,
  ResizablePanel,
} from "@ui-sdk/react-native/resizable"
import { StyleSheet, Text } from "react-native"

const sections = ["Files", "Search", "Settings"]

function Example() {
  return (
    <Resizable style={styles.group}>
      <ResizablePanel
        defaultSize={35}
        minSize={30}
        collapsible
        collapsedSize="48px"
        style={styles.panel}
      >
        {(state) =>
          sections.map((section) => (
            <Text key={section} style={styles.item}>
              {state.collapsed ? section[0] : section}
            </Text>
          ))
        }
      </ResizablePanel>
      <ResizableHandle
        aria-label="Resize sidebar"
        hitSlop={8}
        style={handleStyle}
      />
      <ResizablePanel minSize={40} style={styles.panel}>
        <Text style={styles.title}>README.md</Text>
        <Text style={styles.hint}>Edited by Inès Moreau</Text>
      </ResizablePanel>
    </Resizable>
  )
}

const handleStyle = (state: ResizableHandleState) => [
  styles.handle,
  state.dragging && styles.dragging,
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
  panel: { padding: 12, gap: 8 },
  title: { fontSize: 15, fontWeight: "600" },
  item: { fontSize: 14 },
  hint: { color: "#71717a", fontSize: 13 },
  handle: { width: 1, backgroundColor: "#d4d4d8" },
  dragging: { backgroundColor: "#18181b" },
})

export { Example }
