import { Checkbox, CheckboxIndicator } from "@ui-sdk/react-native/checkbox"
import {
  Select,
  SelectArrow,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  type SelectItemState,
  SelectLabel,
  SelectTrigger,
  type SelectTriggerState,
  SelectValue,
  type SelectValueState,
} from "@ui-sdk/react-native/select"
import { useState } from "react"
import { type HostInstance, StyleSheet, Text, View } from "react-native"

const fonts = [
  { value: "inter", label: "Inter" },
  { value: "geist", label: "Geist" },
  { value: "source-serif", label: "Source Serif" },
  { value: "geist-mono", label: "Geist Mono" },
]

const sides = [
  { value: "top", label: "Top" },
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
]

const aligns = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
]

type Side = "top" | "right" | "bottom" | "left"
type Align = "start" | "center" | "end"

function Example() {
  const [side, setSide] = useState<Side>("bottom")
  const [align, setAlign] = useState<Align>("start")
  const [box, setBox] = useState<HostInstance | null>(null)
  const [anchored, setAnchored] = useState(false)
  return (
    <View style={styles.stack}>
      <View style={styles.controls}>
        <Select
          items={sides}
          value={side}
          onValueChange={(next) => next && setSide(next as Side)}
        >
          <SelectLabel style={styles.label}>Side</SelectLabel>
          <SelectTrigger style={triggerStyle}>
            <SelectValue style={valueStyle} />
            <Text aria-hidden style={styles.chevron}>
              ▾
            </Text>
          </SelectTrigger>
          <SelectContent style={styles.content}>
            {sides.map((item) => (
              <SelectItem key={item.value} value={item.value} style={itemStyle}>
                <Text style={styles.itemText}>{item.label}</Text>
                <SelectItemIndicator>
                  <View style={styles.check} />
                </SelectItemIndicator>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={aligns}
          value={align}
          onValueChange={(next) => next && setAlign(next as Align)}
        >
          <SelectLabel style={styles.label}>Align</SelectLabel>
          <SelectTrigger style={triggerStyle}>
            <SelectValue style={valueStyle} />
            <Text aria-hidden style={styles.chevron}>
              ▾
            </Text>
          </SelectTrigger>
          <SelectContent style={styles.content}>
            {aligns.map((item) => (
              <SelectItem key={item.value} value={item.value} style={itemStyle}>
                <Text style={styles.itemText}>{item.label}</Text>
                <SelectItemIndicator>
                  <View style={styles.check} />
                </SelectItemIndicator>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Checkbox
          checked={anchored}
          onCheckedChange={(next) => setAnchored(next === true)}
          style={styles.row}
        >
          <View style={styles.box}>
            <CheckboxIndicator>
              <View style={styles.check} />
            </CheckboxIndicator>
          </View>
          <Text>Anchor to the box</Text>
        </Checkbox>
      </View>
      <View ref={setBox} collapsable={false} style={styles.card}>
        <Select defaultValue="inter">
          <SelectTrigger aria-label="Font" style={triggerStyle}>
            <SelectValue style={valueStyle} />
            <Text aria-hidden style={styles.chevron}>
              ▾
            </Text>
          </SelectTrigger>
          <SelectContent
            side={side}
            align={align}
            sideOffset={10}
            alignOffset={0}
            collisionPadding={16}
            anchor={anchored ? box : null}
            style={styles.content}
          >
            <SelectArrow style={styles.arrow} />
            {fonts.map((item) => (
              <SelectItem key={item.value} value={item.value} style={itemStyle}>
                <Text style={styles.itemText}>{item.label}</Text>
                <SelectItemIndicator>
                  <View style={styles.check} />
                </SelectItemIndicator>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </View>
    </View>
  )
}

const triggerStyle = (state: SelectTriggerState) => [
  styles.trigger,
  state.disabled && styles.disabled,
]

const valueStyle = (state: SelectValueState) => [
  styles.value,
  state.placeholder && styles.placeholder,
]

const itemStyle = (
  state: SelectItemState,
  { pressed }: { pressed: boolean }
) => [
  styles.item,
  (state.highlighted || pressed) && styles.highlighted,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  arrow: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
    transform: [{ rotate: "45deg" }],
  },
  box: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 6,
    borderColor: "#a1a1aa",
  },
  card: {
    width: 300,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
  },
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
  chevron: { fontSize: 12, color: "#71717a" },
  content: {
    width: 260,
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  controls: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  disabled: { opacity: 0.4 },
  highlighted: { backgroundColor: "#f4f4f5" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  itemText: { fontSize: 16 },
  label: { fontSize: 14, fontWeight: "500" },
  placeholder: { color: "#71717a" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  stack: { gap: 16 },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
    backgroundColor: "#ffffff",
  },
  value: { flex: 1, fontSize: 16 },
})

export { Example }
