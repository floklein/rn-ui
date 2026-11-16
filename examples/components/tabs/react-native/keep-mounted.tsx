import {
  Tabs,
  TabsIndicator,
  type TabsIndicatorState,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@ui-sdk/react-native/tabs"
import { StyleSheet, Text, TextInput } from "react-native"

function Example() {
  return (
    <Tabs defaultValue="reply" style={styles.tabs}>
      <TabsList aria-label="Comment" style={styles.list}>
        <TabsIndicator style={indicatorStyle} />
        <TabsTab value="reply" style={styles.tab}>
          <Text style={styles.label}>Reply</Text>
        </TabsTab>
        <TabsTab value="formatting" style={styles.tab}>
          <Text style={styles.label}>Formatting</Text>
        </TabsTab>
      </TabsList>
      <TabsPanel value="reply" keepMounted style={styles.panel}>
        <TextInput
          accessibilityLabel="Message"
          multiline
          placeholder="Write a reply…"
          style={styles.input}
        />
      </TabsPanel>
      <TabsPanel value="formatting" style={styles.panel}>
        <Text>Use **bold**, _italics_ and `code` to format your reply.</Text>
        <Text>Paste a link on its own line to show a preview.</Text>
      </TabsPanel>
    </Tabs>
  )
}

const indicatorStyle = (state: TabsIndicatorState) => [
  styles.indicator,
  {
    left: state.activeTabLeft,
    top: state.activeTabTop,
    width: state.activeTabWidth,
    height: state.activeTabHeight,
  },
]

const styles = StyleSheet.create({
  tabs: { gap: 12 },
  list: {
    flexDirection: "row",
    alignSelf: "flex-start",
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
  },
  tab: { paddingHorizontal: 12, paddingVertical: 8 },
  label: { fontSize: 14, fontWeight: "500" },
  indicator: {
    position: "absolute",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  panel: { gap: 8 },
  input: {
    minHeight: 80,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    textAlignVertical: "top",
  },
})

export { Example }
