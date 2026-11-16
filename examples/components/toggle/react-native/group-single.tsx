import {
  Toggle,
  ToggleGroup,
  ToggleIcon,
  type ToggleState,
} from "@ui-sdk/react-native/toggle"
import { StyleSheet, Text } from "react-native"

const alignments = [
  { value: "start", label: "Align start", glyph: "⇤", mirror: true },
  { value: "center", label: "Align center", glyph: "↔", mirror: false },
  { value: "end", label: "Align end", glyph: "⇥", mirror: true },
]

function Example() {
  return (
    <ToggleGroup
      defaultValue={["start"]}
      deselectable={false}
      aria-label="Text alignment"
      style={styles.group}
    >
      {alignments.map((item) => (
        <Toggle
          key={item.value}
          value={item.value}
          aria-label={item.label}
          style={toggleStyle}
        >
          {(state) => (
            <ToggleIcon mirror={item.mirror}>
              <Text style={[styles.glyph, state.pressed && styles.pressedGlyph]}>
                {item.glyph}
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
  pressedGlyph: { color: "#ffffff" },
})

export { Example }
