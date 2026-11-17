import { Toggle, type ToggleState } from "@ui-sdk/react-native/toggle"
import {
  createToolbarController,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarInput,
  ToolbarLink,
  ToolbarSeparator,
  type ToolbarButtonState,
} from "@ui-sdk/react-native/toolbar"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const itemStyle = (state: ToggleState | ToolbarButtonState) => [
  styles.item,
  "pressed" in state && state.pressed && styles.pressed,
  state.disabled && styles.disabled,
]

function Fixture() {
  const [log, setLog] = useState<string[]>([])
  const [disabled, setDisabled] = useState(false)
  const [toolbar] = useState(createToolbarController)
  const add = (entry: string) => setLog((current) => [...current, entry])

  return (
    <View style={styles.fixture}>
      <Text testID="toolbar-log">{log.join(" ") || "none"}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          testID="toolbar-disable"
          onPress={() => setDisabled((current) => !current)}
          style={styles.action}
        >
          <Text>{disabled ? "Enable Toolbar" : "Disable Toolbar"}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="toolbar-focus"
          onPress={() => toolbar.focus()}
          style={styles.action}
        >
          <Text>Focus Toolbar</Text>
        </Pressable>
      </View>
      <Toolbar
        aria-label="Formatting"
        disabled={disabled}
        controller={toolbar}
        style={styles.toolbar}
      >
        <Toggle
          aria-label="Bold"
          testID="toolbar-bold"
          onPressedChange={(pressed, details) =>
            add(`bold:${pressed}:${details.source}`)
          }
          style={itemStyle}
        >
          <Text>Bold</Text>
        </Toggle>
        <ToolbarButton
          testID="toolbar-insert"
          onPress={() => add("insert")}
          style={itemStyle}
        >
          <Text>Insert</Text>
        </ToolbarButton>
        <ToolbarSeparator style={styles.separator} />
        <ToolbarGroup disabled aria-label="History" style={styles.group}>
          <ToolbarButton
            testID="toolbar-undo"
            onPress={() => add("undo")}
            style={itemStyle}
          >
            <Text>Undo</Text>
          </ToolbarButton>
          <Toggle
            aria-label="Track"
            testID="toolbar-track"
            onPressedChange={() => add("track")}
            style={itemStyle}
          >
            <Text>Track</Text>
          </Toggle>
        </ToolbarGroup>
        <ToolbarLink
          testID="toolbar-help"
          onPress={() => add("help")}
          style={itemStyle}
        >
          <Text>Help</Text>
        </ToolbarLink>
        <ToolbarInput
          aria-label="Find"
          testID="toolbar-find"
          onChangeText={(text) => add(`find:${text}`)}
          style={styles.field}
        />
      </Toolbar>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    padding: 4,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  group: { flexDirection: "row", gap: 6 },
  item: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  pressed: { backgroundColor: "#e4e4e7" },
  disabled: { opacity: 0.5 },
  separator: { width: 1, alignSelf: "stretch", backgroundColor: "#d4d4d8" },
  field: {
    width: 120,
    minHeight: 44,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    color: "#18181b",
  },
})

export { Fixture }
