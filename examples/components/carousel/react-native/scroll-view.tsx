import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselViewport,
} from "@ui-sdk/react-native/carousel"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const photos = [
  { name: "Dunes" },
  { name: "Forest" },
  { name: "Glacier" },
  { name: "Canyon" },
]
const shelves = ["Recently Viewed", "Saved"]

function Example() {
  const [dragging, setDragging] = useState(false)

  return (
    <ScrollView horizontal scrollEnabled={!dragging} style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.heading}>Featured</Text>
        <Carousel aria-label="Featured">
          <CarouselViewport
            onResponderGrant={() => setDragging(true)}
            onResponderRelease={() => setDragging(false)}
            onResponderTerminate={() => setDragging(false)}
            style={styles.viewport}
          >
            <CarouselContent>
              {photos.map((photo) => (
                <CarouselItem key={photo.name} style={styles.item}>
                  <View style={styles.tile}>
                    <Text style={styles.name}>{photo.name}</Text>
                  </View>
                </CarouselItem>
              ))}
            </CarouselContent>
          </CarouselViewport>
        </Carousel>
      </View>
      {shelves.map((shelf) => (
        <View key={shelf} style={styles.card}>
          <Text style={styles.heading}>{shelf}</Text>
          <View style={styles.tile} />
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: { width: 320, maxWidth: "100%" },
  card: { width: 260, marginEnd: 16, gap: 8 },
  heading: { fontSize: 17, fontWeight: "600" },
  viewport: { borderRadius: 12 },
  item: { width: "100%" },
  tile: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#f4f4f5",
  },
  name: { fontSize: 20, fontWeight: "600" },
})

export { Example }
