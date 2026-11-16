import { Checkbox, CheckboxIndicator } from "@ui-sdk/react-native/checkbox"
import { useState } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"

const tasks = [
  { label: "Write the release notes", done: false },
  { label: "Update the changelog", done: true },
  { label: "Tag the release", done: false },
]

function Task({ label, done }: { label: string; done: boolean }) {
  const [opacity] = useState(() => new Animated.Value(done ? 1 : 0))
  const fade = (toValue: number, then?: () => void) =>
    Animated.timing(opacity, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start(then)

  return (
    <Checkbox
      defaultChecked={done}
      onCheckedChange={(checked) => checked && fade(1)}
      style={styles.row}
    >
      <View style={styles.box}>
        <CheckboxIndicator
          onExit={(exited) => fade(0, exited)}
          render={<Animated.View style={[styles.fill, { opacity }]} />}
        >
          <View style={styles.check} />
        </CheckboxIndicator>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Checkbox>
  )
}

function Example() {
  return (
    <View style={styles.stack}>
      {tasks.map((task) => (
        <Task key={task.label} label={task.label} done={task.done} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#a1a1aa",
    alignItems: "center",
    justifyContent: "center",
  },
  fill: {
    position: "absolute",
    top: -2,
    right: -2,
    bottom: -2,
    left: -2,
    borderRadius: 6,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    width: 6,
    height: 11,
    marginTop: -2,
    borderColor: "#ffffff",
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  label: { fontSize: 16 },
})

export { Example }
