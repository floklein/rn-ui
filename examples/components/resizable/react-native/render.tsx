import {
  Resizable,
  ResizableHandle,
  ResizablePanel,
} from "@ui-sdk/react-native/resizable"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <Resizable style={styles.group}>
      <ResizablePanel
        defaultSize={35}
        minSize={20}
        collapsible
        style={styles.panel}
      >
        {(state) => (
          <>
            <Text style={styles.title}>Files</Text>
            <Text style={styles.hint}>
              {state.collapsed ? "Collapsed" : `${Math.round(state.size)}%`}
            </Text>
          </>
        )}
      </ResizablePanel>
      <ResizableHandle
        aria-label="Resize files"
        hitSlop={8}
        render={(props, state) => (
          <View
            {...props}
            style={[styles.handle, state.dragging && styles.dragging]}
          />
        )}
      />
      <ResizablePanel minSize={30} style={styles.panel}>
        {(state) => (
          <>
            <Text style={styles.title}>Editor</Text>
            <Text style={styles.hint}>{`${Math.round(state.size)}%`}</Text>
          </>
        )}
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
  hint: { color: "#71717a", fontSize: 13 },
  handle: { width: 1, backgroundColor: "#d4d4d8" },
  dragging: { backgroundColor: "#18181b" },
})

export { Example }
