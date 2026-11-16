import {
  createTabsController,
  Tabs,
  TabsIndicator,
  type TabsIndicatorState,
  TabsList,
  TabsPanel,
  TabsTab,
  type TabsTabState,
} from "@ui-sdk/react-native/tabs"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const tabStyle = (state: TabsTabState) => [
  styles.tab,
  state.selected && styles.selected,
  state.disabled && styles.disabled,
]

const indicatorStyle = (state: TabsIndicatorState) => [
  styles.indicator,
  { left: state.activeTabLeft, width: state.activeTabWidth },
]

function Fixture() {
  const [tabs] = useState(() => createTabsController())
  const [changes, setChanges] = useState<string[]>([])
  const [billing, setBilling] = useState(true)

  return (
    <View style={styles.fixture}>
      <Tabs
        controller={tabs}
        onValueChange={(value, details) =>
          setChanges((current) => [
            ...current,
            [value, details.reason, details.source].filter(Boolean).join(":"),
          ])
        }
        style={styles.tabs}
      >
        <TabsList aria-label="Account" style={styles.list}>
          <TabsTab value="profile" testID="tab-profile" style={tabStyle}>
            <Text>Profile</Text>
          </TabsTab>
          {billing && (
            <TabsTab value="billing" testID="tab-billing" style={tabStyle}>
              <Text>Billing</Text>
            </TabsTab>
          )}
          <TabsTab value="team" testID="tab-team" disabled style={tabStyle}>
            <Text>Team</Text>
          </TabsTab>
          <TabsIndicator style={indicatorStyle}>
            {(state) => (
              <Text testID="indicator-box" style={styles.box}>
                {state.activeTabWidth === undefined
                  ? "unmeasured"
                  : `${Math.round(state.activeTabLeft ?? 0)},${Math.round(state.activeTabWidth)}`}
              </Text>
            )}
          </TabsIndicator>
        </TabsList>
        <Text testID="tabs-changes">{changes.join(" ") || "none"}</Text>
        <TabsPanel value="profile" testID="panel-profile">
          <Text testID="panel-profile-text">Profile settings</Text>
        </TabsPanel>
        <TabsPanel value="billing" keepMounted testID="panel-billing">
          <Text testID="panel-billing-text">Billing settings</Text>
        </TabsPanel>
        <TabsPanel value="team" testID="panel-team">
          <Text testID="panel-team-text">Team settings</Text>
        </TabsPanel>
      </Tabs>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          testID="select-billing"
          onPress={() => tabs.select("billing")}
          style={styles.action}
        >
          <Text>Select Billing</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="remove-billing"
          onPress={() => setBilling(false)}
          style={styles.action}
        >
          <Text>Remove Billing</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  tabs: { gap: 8 },
  list: { flexDirection: "row", gap: 6, paddingBottom: 24 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  selected: { backgroundColor: "#e4e4e7" },
  disabled: { opacity: 0.5 },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 20,
    borderTopWidth: 2,
    borderTopColor: "#18181b",
  },
  box: { fontSize: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
})

export { Fixture }
