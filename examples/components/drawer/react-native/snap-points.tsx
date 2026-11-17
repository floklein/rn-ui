import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
  DrawerTrigger,
} from "@ui-sdk/react-native/drawer"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const places = [
  { name: "Blue Bottle Coffee", detail: "Coffee · 0.2 mi" },
  { name: "Tartine Bakery", detail: "Bakery · 0.4 mi" },
  { name: "Dolores Park", detail: "Park · 0.5 mi" },
  { name: "Mission Dolores", detail: "Landmark · 0.6 mi" },
  { name: "Ritual Coffee Roasters", detail: "Coffee · 0.7 mi" },
  { name: "Bi-Rite Creamery", detail: "Ice cream · 0.7 mi" },
  { name: "Alamo Square", detail: "Park · 1.1 mi" },
  { name: "The Castro Theatre", detail: "Cinema · 1.2 mi" },
  { name: "Ferry Building", detail: "Market · 2.3 mi" },
  { name: "Coit Tower", detail: "Landmark · 2.9 mi" },
  { name: "Golden Gate Park", detail: "Park · 3.0 mi" },
  { name: "Lands End", detail: "Trail · 5.4 mi" },
]

function Example() {
  return (
    <Drawer snapPoints={[0.25, 0.5, 1]} defaultSnapPoint={0.5} expandOnScroll>
      <DrawerTrigger style={styles.button}>
        <Text>Find a Place</Text>
      </DrawerTrigger>
      <DrawerBackdrop style={styles.backdrop} />
      <DrawerContent style={[styles.content, styles.full]}>
        <DrawerHandle aria-label="Resize" style={styles.handle}>
          <View style={styles.grip} />
        </DrawerHandle>
        <View style={styles.stack}>
          <DrawerTitle style={styles.title}>Places nearby</DrawerTitle>
          <DrawerDescription style={styles.description}>
            Drag the drawer, or press the handle, to see more.
          </DrawerDescription>
        </View>
        <ScrollView>
          {places.map((place) => (
            <View key={place.name} style={styles.place}>
              <Text>{place.name}</Text>
              <Text style={styles.description}>{place.detail}</Text>
            </View>
          ))}
        </ScrollView>
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
  title: { fontSize: 17, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  full: { height: "100%", paddingTop: 12 },
  handle: { alignSelf: "stretch", paddingVertical: 8 },
  place: { gap: 2, paddingVertical: 10 },
})

export { Example }
