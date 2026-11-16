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
    <Tabs defaultValue="general" orientation="vertical" style={styles.tabs}>
      <TabsList aria-label="Preferences" style={styles.list}>
        <TabsTab value="general" style={tabStyle}>
          <Text style={styles.label}>General</Text>
        </TabsTab>
        <TabsTab value="security" style={tabStyle}>
          <Text style={styles.label}>Security</Text>
        </TabsTab>
        <TabsTab value="integrations" style={tabStyle}>
          <Text style={styles.label}>Integrations</Text>
        </TabsTab>
      </TabsList>
      <TabsPanel value="general" style={styles.panel}>
        <Text>Choose your language, time zone and the page you start on.</Text>
      </TabsPanel>
      <TabsPanel value="security" style={styles.panel}>
        <Text>Manage passkeys, signed-in sessions and recovery codes.</Text>
      </TabsPanel>
      <TabsPanel value="integrations" style={styles.panel}>
        <Text>Connect your calendar and chat apps to get reminders.</Text>
      </TabsPanel>
    </Tabs>
  )
}

const tabStyle = (state: TabsTabState) => [
  styles.tab,
  state.selected && styles.selected,
]

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: 12 },
  list: { gap: 4 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  selected: { backgroundColor: "#f4f4f5" },
  label: { fontSize: 14, fontWeight: "500" },
  panel: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
  },
})

export { Example }
