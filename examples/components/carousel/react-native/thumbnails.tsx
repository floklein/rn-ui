import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselViewport,
} from "@ui-sdk/react-native/carousel"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const photos = [
  { name: "Dunes" },
  { name: "Forest" },
  { name: "Glacier" },
  { name: "Canyon" },
  { name: "Meadow" },
  { name: "Harbor" },
]

function Example() {
  const [page, setPage] = useState(1)
  return (
    <View style={styles.stack}>
      <Carousel aria-label="Photos" page={page} onPageChange={setPage}>
        <CarouselViewport style={styles.viewport}>
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
      <Carousel aria-label="Thumbnails" dragFree slidesPerPage="auto">
        <CarouselViewport>
          <CarouselContent>
            {photos.map((photo, index) => (
              <CarouselItem
                key={photo.name}
                aria-label={photo.name}
                style={styles.thumb}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: page === index + 1 }}
                  onPress={() => setPage(index + 1)}
                  style={[
                    styles.chip,
                    page === index + 1 && styles.chipSelected,
                  ]}
                >
                  <Text style={styles.label}>{photo.name}</Text>
                </Pressable>
              </CarouselItem>
            ))}
          </CarouselContent>
        </CarouselViewport>
      </Carousel>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { width: 320, maxWidth: "100%", gap: 12 },
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
  thumb: { paddingEnd: 8 },
  chip: {
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  chipSelected: { borderColor: "#18181b", backgroundColor: "#f4f4f5" },
  label: { fontSize: 14, fontWeight: "500" },
})

export { Example }
