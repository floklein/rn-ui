import {
  Resizable,
  ResizableHandle,
  ResizablePanel,
  type ResizableStorage,
} from "@ui-sdk/react-native/resizable"
import { StyleSheet, Text } from "react-native"

const saved = new Map<string, string>()

const session: ResizableStorage = {
  getItem: (key) => saved.get(key) ?? null,
  setItem: (key, value) => saved.set(key, value),
}

function Example() {
  return (
    <Resizable autoSaveId="docs-storage" storage={session} style={styles.group}>
      <ResizablePanel
        id="session-chats"
        defaultSize={35}
        minSize={20}
        style={styles.panel}
      >
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.item}>Inès Moreau</Text>
        <Text style={styles.item}>Kofi Mensah</Text>
        <Text style={styles.item}>Wren Takahashi</Text>
      </ResizablePanel>
      <ResizableHandle
        aria-label="Resize messages"
        hitSlop={8}
        style={(state) => [styles.handle, state.dragging && styles.dragging]}
      />
      <ResizablePanel id="session-thread" minSize={20} style={styles.panel}>
        <Text style={styles.title}>Inès Moreau</Text>
        <Text style={styles.hint}>Can we move the review to Friday?</Text>
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
  handle: { width: 1, backgroundColor: "#d4d4d8" },
  dragging: { backgroundColor: "#18181b" },
})

export { Example }
