import {
  Toggle,
  ToggleGroup,
  ToggleIcon,
  type ToggleState,
} from "@ui-sdk/react-native/toggle"
import { StyleSheet, Text } from "react-native"

const formats = [
  { value: "bold", label: "Bold", glyph: "B", style: { fontWeight: "700" } },
  {
    value: "italic",
    label: "Italic",
    glyph: "I",
    style: { fontStyle: "italic" },
  },
  {
    value: "underline",
    label: "Underline",
    glyph: "U",
    style: { textDecorationLine: "underline" },
  },
] as const

function Example() {
  return (
    <ToggleGroup multiple aria-label="Text formatting" style={styles.group}>
      {formats.map((format) => (
        <Toggle
          key={format.value}
          value={format.value}
          aria-label={format.label}
          style={toggleStyle}
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
    </ToggleGroup>
  )
}

const toggleStyle = (state: ToggleState) => [
  styles.toggle,
  state.pressed && styles.pressed,
]

const styles = StyleSheet.create({
  group: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 10,
  },
  toggle: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  pressed: { backgroundColor: "#18181b" },
  glyph: { fontSize: 18, color: "#18181b" },
  glyphPressed: { color: "#ffffff" },
})

export { Example }
