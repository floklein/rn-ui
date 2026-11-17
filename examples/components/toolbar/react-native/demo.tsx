import {
  Toggle,
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

const formats = [
  { label: "Bold", glyph: "B", style: { fontWeight: "700" } },
  { label: "Italic", glyph: "I", style: { fontStyle: "italic" } },
  {
    label: "Underline",
    glyph: "U",
    style: { textDecorationLine: "underline" },
  },
] as const

function Example() {
  const log = useLog()
  return (
    <Toolbar aria-label="Formatting" style={styles.toolbar}>
      {formats.map((format) => (
        <Toggle
          key={format.label}
          aria-label={format.label}
          style={toggleStyle}
          onPressedChange={(pressed) =>
            log(`${format.label} ${pressed ? "on" : "off"}`)
          }
        >
          {(state) => (
            <ToggleIcon>
              <Text
                style={[
                  styles.glyph,
                  format.style,
                  state.pressed && styles.glyphPressed,
                ]}
              >
                {format.glyph}
              </Text>
            </ToggleIcon>
          )}
        </Toggle>
      ))}
      <ToolbarSeparator style={styles.separator} />
      <ToolbarButton
        aria-label="Insert link"
        style={(_state, { pressed }) => [
          styles.item,
          pressed && styles.itemPressed,
        ]}
        onPress={() => log("Insert link")}
      >
        <Text style={styles.glyph}>↗</Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 10,
  },
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
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: 4,
    backgroundColor: "#e4e4e7",
  },
})

export { Example }
