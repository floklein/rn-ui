import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react-native/tabs"
import { Pressable, StyleSheet, Text, View } from "react-native"

const folders = [
  {
    value: "inbox",
    label: "Inbox",
    count: 12,
    content: "12 conversations, 3 of them unread.",
  },
  {
    value: "unread",
    label: "Unread",
    count: 3,
    content: "Hollis Grant, Inès Moreau and Kofi Mensah wrote to you.",
  },
  {
    value: "archived",
    label: "Archived",
    count: 0,
    content: "Nothing archived yet. Archived mail stays searchable.",
  },
]

function Example() {
  return (
    <Tabs defaultValue="inbox" style={styles.tabs}>
      <TabsList aria-label="Mail" style={styles.list}>
        {folders.map((folder) => (
          <TabsTab
            key={folder.value}
            value={folder.value}
            render={(props, state) => (
              <Pressable
                {...props}
                style={[styles.tab, state.selected && styles.selected]}
              >
                <Text style={styles.label}>{folder.label}</Text>
                {folder.count > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.count}>{folder.count}</Text>
                  </View>
                )}
              </Pressable>
            )}
          />
        ))}
      </TabsList>
      {folders.map((folder) => (
        <TabsPanel key={folder.value} value={folder.value}>
          <Text>{folder.content}</Text>
        </TabsPanel>
      ))}
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabs: { gap: 12 },
  list: { flexDirection: "row", gap: 4 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selected: { backgroundColor: "#f4f4f5" },
  label: { fontSize: 14, fontWeight: "500" },
  badge: {
    minWidth: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "#18181b",
  },
  count: { fontSize: 12, color: "#ffffff", textAlign: "center" },
})

export { Example }
