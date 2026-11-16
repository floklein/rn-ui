import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  type TabsTabState,
} from "@ui-sdk/react-native/tabs"
import { StyleSheet, Text } from "react-native"

function Example() {
  return (
    <Tabs defaultValue="account" style={styles.tabs}>
      <TabsList aria-label="Settings" style={styles.list}>
        <TabsTab value="account" style={tabStyle}>
          <Text style={styles.label}>Account</Text>
        </TabsTab>
        <TabsTab value="password" style={tabStyle}>
          <Text style={styles.label}>Password</Text>
        </TabsTab>
      </TabsList>
      <TabsPanel value="account" style={styles.panel}>
        <Text>
          Update your name, email address and profile photo. Your team sees
          changes right away.
        </Text>
      </TabsPanel>
      <TabsPanel value="password" style={styles.panel}>
        <Text>
          Choose a new password for hollis@example.com. You stay signed in on
          this device.
        </Text>
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
  list: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
  },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  selected: { backgroundColor: "#ffffff" },
  label: { fontSize: 14, fontWeight: "500" },
  panel: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
  },
})

export { Example }
