import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
  DrawerTrigger,
} from "@ui-sdk/react-native/drawer"
import * as React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const places = [
  { name: "Blue Bottle Coffee", detail: "Coffee · 0.2 mi" },
  { name: "Tartine Bakery", detail: "Bakery · 0.4 mi" },
  { name: "Dolores Park", detail: "Park · 0.5 mi" },
  { name: "Mission Dolores", detail: "Landmark · 0.6 mi" },
  { name: "Ritual Coffee Roasters", detail: "Coffee · 0.7 mi" },
]

function Example() {
  const [destination, setDestination] = React.useState(places[0].name)
  return (
    <View style={styles.screen}>
      <View aria-label="Places" style={styles.list}>
        {places.map((place) => (
          <Pressable
            key={place.name}
            accessibilityRole="button"
            aria-pressed={destination === place.name}
            onPress={() => setDestination(place.name)}
            style={[styles.place, destination === place.name && styles.chosen]}
          >
            <Text>{place.name}</Text>
            <Text style={styles.description}>{place.detail}</Text>
          </Pressable>
        ))}
      </View>
      <Drawer snapPoints={[0.2, 0.6]} modalAbove={0.2}>
        <DrawerTrigger style={styles.button}>
          <Text>Get Directions</Text>
        </DrawerTrigger>
        <DrawerBackdrop style={styles.backdrop} />
        <DrawerContent style={[styles.content, styles.tall]}>
          {(state) => (
            <>
              <DrawerHandle aria-label="Resize" style={styles.handle}>
                <View style={styles.grip} />
              </DrawerHandle>
              <View style={styles.header}>
                <View style={[styles.stack, styles.fill]}>
                  <DrawerTitle style={styles.title}>
                    To {destination}
                  </DrawerTitle>
                  <DrawerDescription style={styles.description}>
                    {state.interactive
                      ? "12 min walk. Pick another place behind the sheet."
                      : "12 min walk. Drag the sheet down to see the places."}
                  </DrawerDescription>
                </View>
                <DrawerClose style={styles.button}>
                  <Text>Done</Text>
                </DrawerClose>
              </View>
              <View style={styles.stack}>
                <Text>1. Head north on Valencia St.</Text>
                <Text>2. Turn left onto 18th St.</Text>
                <Text>3. Arrive at {destination}.</Text>
              </View>
            </>
          )}
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
  screen: { flex: 1, alignSelf: "stretch", gap: 12, padding: 16 },
  list: { gap: 4 },
  place: { padding: 10, borderRadius: 8 },
  chosen: { backgroundColor: "#f4f4f5" },
  tall: { height: "60%" },
  handle: { alignSelf: "stretch", paddingVertical: 8 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  fill: { flex: 1 },
})

export { Example }
