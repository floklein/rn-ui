import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerHandle,
  DrawerTitle,
  DrawerTrigger,
} from "@ui-sdk/react-native/drawer"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const rows = Array.from(
  { length: 30 },
  (_, index) => `Release note ${index + 1}`
)

function Fixture() {
  const [notes, setNotes] = useState("closed")
  const [scrolled, setScrolled] = useState(0)
  const [places, setPlaces] = useState("closed")
  return (
    <View style={styles.screen}>
      <Text testID="notes-readout">{notes}</Text>
      <Text testID="places-readout">{places}</Text>
      <Drawer
        onOpenChange={(open, details) =>
          setNotes(`${open ? "open" : "closed"} by ${details.reason}`)
        }
      >
        <DrawerTrigger testID="open-notes" style={styles.button}>
          <Text>Open Notes</Text>
        </DrawerTrigger>
        <DrawerBackdrop style={styles.backdrop} />
        <DrawerContent testID="notes" style={[styles.sheet, styles.notes]}>
          <DrawerTitle testID="notes-title" style={styles.title}>
            Release notes
          </DrawerTitle>
          <Text testID="notes-state">
            {`${notes}, scrolled ${scrolled > 0 ? "down" : "to the top"}`}
          </Text>
          <ScrollView
            testID="notes-list"
            scrollEventThrottle={16}
            onScroll={(event) => setScrolled(event.nativeEvent.contentOffset.y)}
          >
            {rows.map((row) => (
              <Text key={row} style={styles.row}>
                {row}
              </Text>
            ))}
          </ScrollView>
          <DrawerClose testID="close-notes" style={styles.button}>
            <Text>Close Notes</Text>
          </DrawerClose>
        </DrawerContent>
      </Drawer>
      <Drawer
        snapPoints={[0.4, 0.8]}
        onOpenChange={(open, details) =>
          setPlaces(`${open ? "open" : "closed"} by ${details.reason}`)
        }
        onSnapPointChange={(point, details) =>
          setPlaces(`at ${point} by ${details.reason}`)
        }
      >
        <DrawerTrigger testID="open-places" style={styles.button}>
          <Text>Open Places</Text>
        </DrawerTrigger>
        <DrawerBackdrop style={styles.backdrop} />
        <DrawerContent testID="places" style={[styles.sheet, styles.places]}>
          <DrawerHandle
            aria-label="Resize"
            testID="handle"
            style={styles.handle}
          >
            <View style={styles.grip} />
          </DrawerHandle>
          <DrawerTitle style={styles.title}>Places</DrawerTitle>
          <Text testID="places-state">{places}</Text>
          <DrawerClose testID="close-places" style={styles.button}>
            <Text>Close Places</Text>
          </DrawerClose>
        </DrawerContent>
      </Drawer>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { alignSelf: "stretch", gap: 12, padding: 16 },
  button: {
    alignSelf: "flex-start",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  backdrop: { position: "absolute", inset: 0, backgroundColor: "#00000033" },
  sheet: {
    gap: 12,
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#ffffff",
  },
  notes: { height: "70%" },
  places: { height: "80%" },
  title: { fontSize: 17, fontWeight: "600" },
  row: { paddingVertical: 12 },
  handle: { alignSelf: "stretch", alignItems: "center", paddingVertical: 12 },
  grip: { width: 36, height: 5, borderRadius: 3, backgroundColor: "#d4d4d8" },
})

export { Fixture }
