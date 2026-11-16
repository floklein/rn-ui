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
    <Tabs defaultValue="overview" style={styles.tabs}>
      <TabsList aria-label="Dashboard" style={styles.list}>
        <TabsTab value="overview" style={tabStyle}>
          <Text style={styles.label}>Overview</Text>
        </TabsTab>
        <TabsTab value="analytics" style={tabStyle}>
          <Text style={styles.label}>Analytics</Text>
        </TabsTab>
        <TabsTab value="reports" disabled style={tabStyle}>
          <Text style={styles.label}>Reports</Text>
        </TabsTab>
      </TabsList>
      <TabsPanel value="overview" style={styles.panel}>
        <Text>Revenue, visitors and sign-ups for the last 30 days.</Text>
      </TabsPanel>
      <TabsPanel value="analytics" style={styles.panel}>
        <Text>Where your visitors come from and the pages they read most.</Text>
      </TabsPanel>
      <TabsPanel value="reports" style={styles.panel}>
        <Text>Monthly reports are available on the Pro plan.</Text>
      </TabsPanel>
    </Tabs>
  )
}

const tabStyle = (state: TabsTabState) => [
  styles.tab,
  state.selected && styles.selected,
  state.disabled && styles.disabled,
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
  disabled: { opacity: 0.4 },
  label: { fontSize: 14, fontWeight: "500" },
  panel: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
  },
})

export { Example }
