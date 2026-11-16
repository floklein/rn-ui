import {
  createTabsController,
  Tabs,
  TabsIndicator,
  type TabsIndicatorState,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@ui-sdk/react-native/tabs"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [tabs] = useState(() => createTabsController())
  const [value, setValue] = useState<string | null>("inbox")

  return (
    <View style={styles.stack}>
      <Pressable
        accessibilityRole="button"
        onPress={() => tabs.select("sent")}
        style={styles.button}
      >
        <Text>Show Sent Mail</Text>
      </Pressable>
      <Tabs
        value={value}
        onValueChange={(next, details) => {
          setValue(next)
          log(`value: ${next} (${details.reason})`)
        }}
        controller={tabs}
        style={styles.tabs}
      >
        <TabsList aria-label="Mail" style={styles.list}>
          <TabsIndicator style={indicatorStyle} />
          <TabsTab value="inbox" style={styles.tab}>
            <Text style={styles.label}>Inbox</Text>
          </TabsTab>
          <TabsTab value="drafts" style={styles.tab}>
            <Text style={styles.label}>Drafts</Text>
          </TabsTab>
          <TabsTab value="sent" style={styles.tab}>
            <Text style={styles.label}>Sent</Text>
          </TabsTab>
        </TabsList>
        <TabsPanel value="inbox">
          <Text>3 unread messages from Hollis Grant and Inès Moreau.</Text>
        </TabsPanel>
        <TabsPanel value="drafts">
          <Text>2 drafts, the last one edited yesterday at 4:12 PM.</Text>
        </TabsPanel>
        <TabsPanel value="sent">
          <Text>12 messages sent this week, all delivered.</Text>
        </TabsPanel>
      </Tabs>
    </View>
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
  stack: { gap: 16, alignItems: "flex-start" },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  tabs: { gap: 12 },
  list: {
    flexDirection: "row",
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
})

export { Example }
