import {
  Separator,
  type SeparatorOrientation,
  type SeparatorState,
} from "@ui-sdk/react-native/separator"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const line = (state: SeparatorState) => [
  styles.line,
  state.orientation === "vertical" ? styles.vertical : styles.horizontal,
]

function Fixture() {
  const [orientation, setOrientation] =
    useState<SeparatorOrientation>("horizontal")
  return (
    <View style={styles.fixture}>
      <Pressable
        accessibilityRole="button"
        testID="flip-orientation"
        onPress={() =>
          setOrientation(
            orientation === "horizontal" ? "vertical" : "horizontal"
          )
        }
        style={styles.action}
      >
        <Text>Flip Orientation</Text>
      </Pressable>
      <Text testID="heading">Hollis Grant</Text>
      <View style={styles.box}>
        <Separator
          testID="separator-flip"
          orientation={orientation}
          style={line}
        />
      </View>
      <View style={styles.row}>
        <Text testID="profile">Profile</Text>
        <Separator
          testID="separator-vertical"
          orientation="vertical"
          style={line}
        />
        <Text testID="billing">Billing</Text>
      </View>
      <View style={styles.row}>
        <Separator testID="separator-decorative" decorative style={line} />
        <Text testID="or">or</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 12 },
  action: {
    alignSelf: "flex-start",
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
  box: { height: 80, flexDirection: "row" },
  row: { flexDirection: "row", alignItems: "stretch", gap: 12 },
  line: { backgroundColor: "#a1a1aa" },
  horizontal: { height: 4, flexGrow: 1, alignSelf: "flex-start" },
  vertical: { width: 4, alignSelf: "stretch" },
})

export { Fixture }
