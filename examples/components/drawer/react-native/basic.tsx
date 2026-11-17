import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@ui-sdk/react-native/drawer"
import * as React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const goal = { initial: 350, min: 200, max: 400, step: 10 }

function Example() {
  const [calories, setCalories] = React.useState(goal.initial)
  return (
    <Drawer>
      <DrawerTrigger style={styles.button}>
        <Text>Open Drawer</Text>
      </DrawerTrigger>
      <DrawerBackdrop style={styles.backdrop} />
      <DrawerContent style={styles.content}>
        <View style={styles.grip} />
        <View style={styles.stack}>
          <DrawerTitle style={styles.title}>Move goal</DrawerTitle>
          <DrawerDescription style={styles.description}>
            Set your daily activity goal.
          </DrawerDescription>
        </View>
        <View style={[styles.row, styles.goal]}>
          <Pressable
            accessibilityRole="button"
            aria-label="Decrease"
            disabled={calories <= goal.min}
            onPress={() => setCalories(calories - goal.step)}
            style={styles.round}
          >
            <Text>−</Text>
          </Pressable>
          <View style={styles.value}>
            <Text accessibilityLiveRegion="polite" style={styles.number}>
              {calories}
            </Text>
            <Text style={styles.hint}>Calories/day</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            aria-label="Increase"
            disabled={calories >= goal.max}
            onPress={() => setCalories(calories + goal.step)}
            style={styles.round}
          >
            <Text>+</Text>
          </Pressable>
        </View>
        <View style={styles.stack}>
          <DrawerClose
            value="submit"
            style={[styles.button, styles.solid, styles.wide]}
          >
            <Text style={styles.solidText}>Submit</Text>
          </DrawerClose>
          <DrawerClose style={[styles.button, styles.wide]}>
            <Text>Cancel</Text>
          </DrawerClose>
        </View>
      </DrawerContent>
    </Drawer>
  )
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  solid: { backgroundColor: "#18181b", borderColor: "#18181b" },
  solidText: { color: "#fafafa", fontWeight: "500" },
  backdrop: { position: "absolute", inset: 0, backgroundColor: "#00000033" },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#ffffff",
  },
  grip: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#d4d4d8",
  },
  stack: { gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  hint: { fontSize: 13, color: "#71717a" },
  goal: { justifyContent: "center", gap: 24 },
  round: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 18,
    borderColor: "#d4d4d8",
  },
  value: { alignItems: "center" },
  number: { fontSize: 48, fontWeight: "700" },
  wide: { alignSelf: "stretch", alignItems: "center" },
})

export { Example }
