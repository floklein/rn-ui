import {
  createDrawerController,
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@ui-sdk/react-native/drawer"
import * as React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

type PhotoAction = "share" | "duplicate" | "delete" | "cancel"

const actions = [
  { value: "share", label: "Share" },
  { value: "duplicate", label: "Duplicate" },
  { value: "delete", label: "Delete" },
  { value: "cancel", label: "Cancel" },
] as const

function Example() {
  const [photoActions] = React.useState(() =>
    createDrawerController<undefined, PhotoAction>()
  )
  const log = useLog()

  async function choose() {
    const { returnValue = "cancel" } = await photoActions.open()
    log(returnValue === "cancel" ? "Canceled" : `Chose ${returnValue}`)
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        onPress={choose}
        style={styles.button}
      >
        <Text>Photo Options</Text>
      </Pressable>
      <Drawer controller={photoActions}>
        <DrawerBackdrop style={styles.backdrop} />
        <DrawerContent style={styles.content}>
          <View style={styles.stack}>
            <DrawerTitle style={styles.title}>Beach.jpg</DrawerTitle>
            <DrawerDescription style={styles.description}>
              Taken today at 9:41.
            </DrawerDescription>
          </View>
          <View style={styles.stack}>
            {actions.map((action) => (
              <DrawerClose
                key={action.value}
                value={action.value}
                style={[styles.button, styles.wide]}
              >
                <Text>{action.label}</Text>
              </DrawerClose>
            ))}
          </View>
        </DrawerContent>
      </Drawer>
    </View>
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
  title: { fontSize: 17, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  wide: { alignSelf: "stretch", alignItems: "center" },
})

export { Example }
