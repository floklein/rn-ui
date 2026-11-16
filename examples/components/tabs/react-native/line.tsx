import {
  Tabs,
  TabsIndicator,
  type TabsIndicatorState,
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
        <TabsTab value="overview" style={styles.tab}>
          {(state) => <Text style={labelStyle(state)}>Overview</Text>}
        </TabsTab>
        <TabsTab value="analytics" style={styles.tab}>
          {(state) => <Text style={labelStyle(state)}>Analytics</Text>}
        </TabsTab>
        <TabsTab value="reports" style={styles.tab}>
          {(state) => <Text style={labelStyle(state)}>Reports</Text>}
        </TabsTab>
        <TabsIndicator style={indicatorStyle} />
      </TabsList>
      <TabsPanel value="overview">
        <Text>Revenue, visitors and sign-ups for the last 30 days.</Text>
      </TabsPanel>
      <TabsPanel value="analytics">
        <Text>Where visitors come from and what they do.</Text>
      </TabsPanel>
      <TabsPanel value="reports">
        <Text>Monthly reports, ready to download.</Text>
      </TabsPanel>
    </Tabs>
  )
}

const labelStyle = (state: TabsTabState) => [
  styles.label,
  state.selected && styles.selected,
]

const indicatorStyle = (state: TabsIndicatorState) => [
  styles.indicator,
  { left: state.activeTabLeft, width: state.activeTabWidth },
]

const styles = StyleSheet.create({
  tabs: { gap: 16 },
  list: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  tab: { paddingHorizontal: 12, paddingVertical: 10 },
  label: { fontSize: 14, fontWeight: "500", color: "#71717a" },
  selected: { color: "#18181b" },
  indicator: {
    position: "absolute",
    bottom: -1,
    height: 2,
    backgroundColor: "#18181b",
  },
})

export { Example }
