import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  type SelectItemState,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react-native/select"
import { Toolbar, ToolbarButton } from "@ui-sdk/react-native/toolbar"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const zooms = ["50%", "75%", "100%", "150%", "200%"]

function Example() {
  const log = useLog()
  const [zoom, setZoom] = useState("100%")
  const index = zooms.indexOf(zoom)
  const change = (value: string) => {
    setZoom(value)
    log(`Zoom ${value}`)
  }
  return (
    <Toolbar aria-label="View" style={styles.toolbar}>
      <ToolbarButton
        aria-label="Zoom out"
        disabled={index === 0}
        style={(state) => [styles.item, state.disabled && styles.disabled]}
        onPress={() => change(zooms[index - 1])}
      >
        <Text style={styles.glyph}>−</Text>
      </ToolbarButton>
      <Select value={zoom} onValueChange={(value) => value && change(value)}>
        <SelectTrigger aria-label="Zoom" style={styles.zoom}>
          <SelectValue style={styles.value} />
          <Text aria-hidden style={styles.chevron}>
            ▾
          </Text>
        </SelectTrigger>
        <SelectContent style={styles.content}>
          {zooms.map((zoom) => (
            <SelectItem key={zoom} value={zoom} style={itemStyle}>
              <Text>{zoom}</Text>
              <SelectItemIndicator>
                <View style={styles.check} />
              </SelectItemIndicator>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ToolbarButton
        aria-label="Zoom in"
        disabled={index === zooms.length - 1}
        style={(state) => [styles.item, state.disabled && styles.disabled]}
        onPress={() => change(zooms[index + 1])}
      >
        <Text style={styles.glyph}>+</Text>
      </ToolbarButton>
    </Toolbar>
  )
}

const itemStyle = (
  state: SelectItemState,
  { pressed }: { pressed: boolean }
) => [styles.option, (state.highlighted || pressed) && styles.highlighted]

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
  disabled: { opacity: 0.4 },
  glyph: { fontSize: 18, color: "#18181b" },
  zoom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  value: { fontSize: 15 },
  chevron: { fontSize: 12, color: "#71717a" },
  content: {
    width: 120,
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  highlighted: { backgroundColor: "#f4f4f5" },
  check: {
    width: 6,
    height: 11,
    marginTop: -2,
    marginRight: 4,
    borderColor: "#18181b",
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
})

export { Example }
