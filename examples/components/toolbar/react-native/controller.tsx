import { Button } from "@ui-sdk/react-native/button"
import {
  createToolbarController,
  Toolbar,
  ToolbarButton,
} from "@ui-sdk/react-native/toolbar"
import * as React from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const actions = [
  { label: "Bold", glyph: "B" },
  { label: "Italic", glyph: "I" },
  { label: "Insert link", glyph: "↗" },
]

function Example() {
  const log = useLog()
  const [toolbar] = React.useState(createToolbarController)
  return (
    <View style={styles.stack}>
      <Button
        onPress={() => toolbar.focus()}
        style={(_state, { pressed }) => [
          styles.control,
          pressed && styles.itemPressed,
        ]}
      >
        <Text style={styles.controlLabel}>Focus Toolbar</Text>
      </Button>
      <Toolbar
        controller={toolbar}
        aria-label="Notes formatting"
        style={styles.toolbar}
      >
        {actions.map(({ label, glyph }) => (
          <ToolbarButton
            key={label}
            aria-label={label}
            style={(_state, { pressed }) => [
              styles.item,
              pressed && styles.itemPressed,
            ]}
            onPress={() => log(label)}
          >
            <Text style={styles.glyph}>{glyph}</Text>
          </ToolbarButton>
        ))}
      </Toolbar>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12, alignItems: "flex-start" },
  control: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
  },
  controlLabel: { fontSize: 15, color: "#18181b" },
  toolbar: {
    flexDirection: "row",
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
  glyph: { fontSize: 18, color: "#18181b" },
})

export { Example }
