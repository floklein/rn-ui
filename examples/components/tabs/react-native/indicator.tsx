import {
  Tabs,
  TabsIndicator,
  type TabsIndicatorState,
  TabsList,
  type TabsListState,
  TabsPanel,
  TabsTab,
} from "@ui-sdk/react-native/tabs"
import {
  Toggle,
  ToggleGroup,
  type ToggleState,
} from "@ui-sdk/react-native/toggle"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"

const orientations = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
] as const

function Example() {
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "horizontal"
  )

  return (
    <View style={styles.stack}>
      <ToggleGroup
        aria-label="Orientation"
        value={[orientation]}
        onValueChange={([next]) => next && setOrientation(next)}
        style={styles.controls}
      >
        {orientations.map((option) => (
          <Toggle key={option.value} value={option.value} style={toggleStyle}>
            <Text>{option.label}</Text>
          </Toggle>
        ))}
      </ToggleGroup>
      <Tabs defaultValue="music" orientation={orientation} style={styles.tabs}>
        <TabsList aria-label="Library" style={listStyle}>
          <TabsIndicator style={indicatorStyle} />
          <TabsTab value="music" style={styles.tab}>
            <Text style={styles.label}>Music</Text>
          </TabsTab>
          <TabsTab value="podcasts" style={styles.tab}>
            <Text style={styles.label}>Podcasts</Text>
          </TabsTab>
          <TabsTab value="audiobooks" style={styles.tab}>
            <Text style={styles.label}>Audiobooks</Text>
          </TabsTab>
        </TabsList>
        <TabsPanel value="music">
          <Text>312 songs in 24 albums, synced to this device.</Text>
        </TabsPanel>
        <TabsPanel value="podcasts">
          <Text>8 shows you follow, with 3 new episodes.</Text>
        </TabsPanel>
        <TabsPanel value="audiobooks">
          <Text>2 books in progress, 6 hours left in total.</Text>
        </TabsPanel>
      </Tabs>
    </View>
  )
}

const toggleStyle = (state: ToggleState) => [
  styles.toggle,
  state.pressed && styles.pressed,
]

const listStyle = (state: TabsListState) => [
  styles.list,
  state.orientation === "horizontal" && styles.row,
]

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
  stack: { gap: 16 },
  controls: { flexDirection: "row", gap: 8 },
  toggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  pressed: { backgroundColor: "#f4f4f5" },
  tabs: { gap: 12 },
  list: {
    alignSelf: "flex-start",
    gap: 4,
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
  },
  row: { flexDirection: "row" },
  tab: { paddingHorizontal: 12, paddingVertical: 8 },
  label: { fontSize: 14, fontWeight: "500" },
  indicator: {
    position: "absolute",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#18181b",
    backgroundColor: "#ffffff",
  },
})

export { Example }
