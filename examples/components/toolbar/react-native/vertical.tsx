import {
  Toggle,
  ToggleGroup,
  ToggleIcon,
  type ToggleState,
} from "@ui-sdk/react-native/toggle"
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from "@ui-sdk/react-native/toolbar"
import { StyleSheet, Text } from "react-native"
import { useLog } from "../../../shared/react/log"

const tools = [
  { value: "select", label: "Select", glyph: "➚" },
  { value: "draw", label: "Draw", glyph: "✎" },
  { value: "shape", label: "Shape", glyph: "□" },
  { value: "text", label: "Text", glyph: "T" },
]

function Example() {
  const log = useLog()
  return (
    <Toolbar orientation="vertical" aria-label="Canvas" style={styles.toolbar}>
      <ToggleGroup
        defaultValue={["select"]}
        deselectable={false}
        orientation="vertical"
        aria-label="Tool"
        style={styles.group}
        onValueChange={([value]) =>
          log(`${tools.find((tool) => tool.value === value)?.label} tool`)
        }
      >
        {tools.map(({ value, label, glyph }) => (
          <Toggle
            key={value}
            value={value}
            aria-label={label}
            style={toggleStyle}
          >
            {(state) => (
              <ToggleIcon>
                <Text
                  style={[styles.glyph, state.pressed && styles.glyphPressed]}
                >
                  {glyph}
                </Text>
              </ToggleIcon>
            )}
          </Toggle>
        ))}
      </ToggleGroup>
      <ToolbarSeparator style={styles.separator} />
      <ToolbarButton
        aria-label="Delete"
        style={(_state, { pressed }) => [
          styles.item,
          pressed && styles.itemPressed,
        ]}
        onPress={() => log("Deleted selection")}
      >
        <Text style={styles.glyph}>🗑</Text>
      </ToolbarButton>
    </Toolbar>
  )
}

const toggleStyle = (state: ToggleState) => [
  styles.item,
  state.pressed && styles.pressed,
]

const styles = StyleSheet.create({
  toolbar: {
    alignSelf: "flex-start",
    gap: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 10,
  },
  group: { gap: 4 },
  item: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  itemPressed: { backgroundColor: "#f4f4f5" },
  pressed: { backgroundColor: "#18181b" },
  glyph: { fontSize: 18, color: "#18181b" },
  glyphPressed: { color: "#ffffff" },
  separator: {
    height: 1,
    marginVertical: 4,
    backgroundColor: "#e4e4e7",
  },
})

export { Example }
