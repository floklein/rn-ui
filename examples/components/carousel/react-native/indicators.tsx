import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselIndicatorGroup,
  type CarouselIndicatorState,
  CarouselItem,
  CarouselViewport,
} from "@ui-sdk/react-native/carousel"
import { StyleSheet, Text, View } from "react-native"

const photos = [
  { name: "Dunes" },
  { name: "Forest" },
  { name: "Glacier" },
  { name: "Canyon" },
  { name: "Meadow" },
  { name: "Harbor" },
]

function Example() {
  return (
    <Carousel aria-label="Photos" style={styles.carousel}>
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
      <CarouselIndicatorGroup aria-label="Choose a photo" style={styles.dots}>
        {photos.map((photo, index) => (
          <CarouselIndicator
            key={photo.name}
            page={index + 1}
            aria-label={photo.name}
            hitSlop={8}
            style={dotStyle}
          />
        ))}
      </CarouselIndicatorGroup>
    </Carousel>
  )
}

const dotStyle = (state: CarouselIndicatorState) => [
  styles.dot,
  state.selected && styles.selected,
]

const styles = StyleSheet.create({
  carousel: { width: 320, maxWidth: "100%", gap: 12 },
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
  dots: { flexDirection: "row", justifyContent: "center", gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#d4d4d8" },
  selected: { backgroundColor: "#18181b" },
})

export { Example }
