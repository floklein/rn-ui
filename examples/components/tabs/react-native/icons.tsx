import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  TabsTabIcon,
  type TabsTabState,
} from "@ui-sdk/react-native/tabs"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <Tabs defaultValue="inbox" style={styles.tabs}>
      <TabsList aria-label="Mail" style={styles.list}>
        <TabsTab value="inbox" style={tabStyle}>
          <TabsTabIcon style={styles.icon}>
            <View style={styles.envelope} />
          </TabsTabIcon>
          <Text style={styles.label}>Inbox</Text>
        </TabsTab>
        <TabsTab value="replies" style={tabStyle}>
          <TabsTabIcon mirror style={styles.icon}>
            <View style={styles.arrow} />
          </TabsTabIcon>
          <Text style={styles.label}>Replies</Text>
        </TabsTab>
        <TabsTab value="archive" style={tabStyle}>
          <TabsTabIcon style={styles.icon}>
            <View style={styles.box} />
          </TabsTabIcon>
          <Text style={styles.label}>Archive</Text>
        </TabsTab>
      </TabsList>
      <TabsPanel value="inbox">
        <Text>3 new messages from Inès Moreau and Kofi Mensah.</Text>
      </TabsPanel>
      <TabsPanel value="replies">
        <Text>Wren Takahashi replied to your message about the launch.</Text>
      </TabsPanel>
      <TabsPanel value="archive">
        <Text>Messages you archived stay here and in search.</Text>
      </TabsPanel>
    </Tabs>
  )
}

const tabStyle = (state: TabsTabState) => [
  styles.tab,
  state.selected && styles.selected,
]

const styles = StyleSheet.create({
  tabs: { gap: 12 },
  list: { flexDirection: "row", gap: 4 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selected: { backgroundColor: "#f4f4f5" },
  label: { fontSize: 14, fontWeight: "500" },
  icon: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  envelope: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderColor: "#52525b",
    borderRadius: 2,
  },
  arrow: {
    width: 10,
    height: 10,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "#52525b",
    transform: [{ rotate: "45deg" }],
  },
  box: {
    width: 14,
    height: 12,
    borderWidth: 1.5,
    borderTopWidth: 3,
    borderColor: "#52525b",
    borderRadius: 2,
  },
})

export { Example }
