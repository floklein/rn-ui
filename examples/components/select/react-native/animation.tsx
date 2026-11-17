import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  type SelectItemState,
  SelectTrigger,
  type SelectTriggerState,
  SelectValue,
  type SelectValueState,
} from "@ui-sdk/react-native/select"
import { useEffect, useState } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const roles = [
  { value: "viewer", label: "Viewer" },
  { value: "commenter", label: "Commenter" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
]

const fade = (progress: Animated.Value, toValue: number) =>
  Animated.timing(progress, { toValue, duration: 150, useNativeDriver: true })

function Enter({ progress }: { progress: Animated.Value }) {
  useEffect(() => {
    fade(progress, 1).start()
  }, [progress])
  return null
}

function Example() {
  const log = useLog()
  const [progress] = useState(() => new Animated.Value(0))
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Role</FieldLabel>
      <Select
        defaultValue="editor"
        onOpenChangeComplete={(open) =>
          log(open ? "Finished opening" : "Finished closing")
        }
      >
        <SelectTrigger style={triggerStyle}>
          <SelectValue style={valueStyle} />
          <Text aria-hidden style={styles.chevron}>
            ▾
          </Text>
        </SelectTrigger>
        <SelectContent
          render={
            <Animated.View
              style={{
                opacity: progress,
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-4, 0],
                    }),
                  },
                ],
              }}
            />
          }
          style={(state) => [
            styles.content,
            { transformOrigin: state.transformOrigin },
          ]}
          onExit={(done) => fade(progress, 0).start(() => done())}
        >
          <Enter progress={progress} />
          {roles.map((role) => (
            <SelectItem key={role.value} value={role.value} style={itemStyle}>
              <Text style={styles.itemText}>{role.label}</Text>
              <SelectItemIndicator
                keepMounted
                style={(state) => ({ opacity: state.selected ? 1 : 0 })}
              >
                <View style={styles.check} />
              </SelectItemIndicator>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
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
  disabled: { opacity: 0.4 },
  field: { width: 260, gap: 6 },
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
