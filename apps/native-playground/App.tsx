import { useState } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { screens, type Screen } from "./screens"

function App() {
  const [open, setOpen] = useState<Screen>()
  if (open) {
    return (
      <GestureHandlerRootView style={styles.screen}>
        <Pressable
          accessibilityRole="button"
          testID="back"
          onPress={() => setOpen(undefined)}
          style={styles.back}
        >
          <Text>Back</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          {open.title}
        </Text>
        <View style={styles.example}>
          <open.Screen />
        </View>
      </GestureHandlerRootView>
    )
  }
  return (
    <GestureHandlerRootView style={styles.fill}>
      <ScrollView style={styles.fill} contentContainerStyle={styles.list}>
        {screens.map((screen) => (
          <Pressable
            key={screen.id}
            accessibilityRole="button"
            testID={screen.id}
            onPress={() => setOpen(screen)}
            style={styles.item}
          >
            <Text>{screen.title}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 64, backgroundColor: "#ffffff" },
  fill: { flex: 1, backgroundColor: "#ffffff" },
  list: { padding: 16, paddingTop: 64, gap: 8 },
  item: { padding: 14, borderRadius: 8, backgroundColor: "#f4f4f5" },
  back: { alignSelf: "flex-start", marginHorizontal: 16, padding: 8 },
  title: { marginHorizontal: 16, marginVertical: 12, fontSize: 18 },
  example: { flex: 1, alignItems: "center", justifyContent: "center" },
})

export { App }
