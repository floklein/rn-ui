import { traceHost } from "@ui-sdk/react-native/primitive"
import { useCallback, useEffect, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { DialogScreen } from "./screens/DialogScreen"
import { SwitchScreen } from "./screens/SwitchScreen"

const screens = { Switch: SwitchScreen, Dialog: DialogScreen }

function App() {
  const [screen, setScreen] = useState<keyof typeof screens>("Switch")
  const [lines, setLines] = useState<string[]>([])
  const log = useCallback((line: string) => {
    console.log(`[proto] ${line}`)
    setLines((current) => [...current, `${current.length + 1}. ${line}`])
  }, [])
  useEffect(
    () =>
      traceHost((request) =>
        log(
          request.type === "focus"
            ? `host.focus slot=${request.slot} key=${JSON.stringify(request.key)} viewMounted=${request.mounted}`
            : request.type === "input"
              ? `host.input ${request.input} taken=${request.taken}`
              : `host.listen listening=${request.listening}`
        )
      ),
    [log]
  )
  const Screen = screens[screen]
  return (
    <View style={styles.screen}>
      <View style={styles.tabs}>
        {(Object.keys(screens) as (keyof typeof screens)[]).map((name) => (
          <Pressable
            key={name}
            accessibilityRole="button"
            testID={`tab-${name}`}
            onPress={() => setScreen(name)}
            style={[styles.tab, screen === name && styles.tabActive]}
          >
            <Text>{name}</Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          testID="clear-log"
          onPress={() => setLines([])}
          style={styles.tab}
        >
          <Text>Clear log</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        <Screen log={log} />
      </ScrollView>
      <View style={styles.log} testID="log">
        {lines.slice(-9).map((line) => (
          <Text key={line} style={styles.line}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 56, backgroundColor: "#fff" },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 12 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  tabActive: { backgroundColor: "#bfdbfe" },
  body: { flex: 1 },
  content: { padding: 12, gap: 10 },
  log: {
    minHeight: 190,
    padding: 8,
    paddingBottom: 28,
    backgroundColor: "#111",
  },
  line: { color: "#d1fae5", fontSize: 10, fontFamily: "Courier" },
})

export { App }
