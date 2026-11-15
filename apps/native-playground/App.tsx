import { useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { screens, type Screen } from "./screens"

function App() {
  const [open, setOpen] = useState<Screen>()
  if (open) {
    return (
      <View style={styles.screen}>
        <Pressable
          accessibilityRole="button"
          testID="back"
          onPress={() => setOpen(undefined)}
          style={styles.back}
        >
          <Text>Back</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          {open.component} / {open.example}
        </Text>
        <View style={styles.example}>
          <open.Example />
        </View>
      </View>
    )
  }
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.list}>
      {screens.map((screen) => (
        <Pressable
          key={`${screen.component}/${screen.example}`}
          accessibilityRole="button"
          testID={`screen-${screen.component}-${screen.example}`}
          onPress={() => setOpen(screen)}
          style={styles.item}
        >
          <Text>
            {screen.component} / {screen.example}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 64, backgroundColor: "#ffffff" },
  list: { padding: 16, gap: 8 },
  item: { padding: 14, borderRadius: 8, backgroundColor: "#f4f4f5" },
  back: { alignSelf: "flex-start", marginHorizontal: 16, padding: 8 },
  title: { marginHorizontal: 16, marginVertical: 12, fontSize: 18 },
  example: { flex: 1, alignItems: "center", justifyContent: "center" },
})

export { App }
