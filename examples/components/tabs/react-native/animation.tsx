import {
  Tabs,
  TabsIndicator,
  type TabsIndicatorState,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@ui-sdk/react-native/tabs"
import { LayoutAnimation, StyleSheet, Text } from "react-native"

function Example() {
  return (
    <Tabs
      defaultValue="overview"
      onValueChange={() =>
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      }
      style={styles.tabs}
    >
      <TabsList aria-label="Project" style={styles.list}>
        <TabsIndicator style={indicatorStyle} />
        <TabsTab value="overview" style={styles.tab}>
          <Text style={styles.label}>Overview</Text>
        </TabsTab>
        <TabsTab value="activity" style={styles.tab}>
          <Text style={styles.label}>Activity</Text>
        </TabsTab>
        <TabsTab value="settings" style={styles.tab}>
          <Text style={styles.label}>Settings</Text>
        </TabsTab>
      </TabsList>
      <TabsPanel value="overview" style={styles.panel}>
        <Text>The launch is on track for Friday, with 4 of 6 tasks done.</Text>
      </TabsPanel>
      <TabsPanel value="activity" style={styles.panel}>
        <Text>
          Inès Moreau deployed to production and Kofi Mensah left a review.
        </Text>
      </TabsPanel>
      <TabsPanel value="settings" style={styles.panel}>
        <Text>
          Rename the project, transfer it to another team or archive it.
        </Text>
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
  panel: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
  },
})

export { Example }
