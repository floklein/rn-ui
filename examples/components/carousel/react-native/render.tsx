import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselStepState,
  CarouselViewport,
} from "@ui-sdk/react-native/carousel"
import { Linking, Pressable, StyleSheet, Text, View } from "react-native"

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
              {(state) => (
                <View style={styles.tile}>
                  <Text style={styles.name}>{photo.name}</Text>
                  <Text style={styles.hint}>
                    {state.index + 1} / {photos.length}
                    {state.active && " · showing"}
                  </Text>
                </View>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
      </CarouselViewport>
      <View style={styles.row}>
        <CarouselPrevious style={stepStyle}>
          <Text style={styles.label}>‹ Previous</Text>
        </CarouselPrevious>
        <CarouselNext
          render={(props, state) =>
            state.disabled ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => Linking.openURL("https://example.com/gallery")}
                style={styles.button}
              >
                <Text style={styles.label}>See All Photos</Text>
              </Pressable>
            ) : (
              <Pressable {...props} style={styles.button}>
                <Text style={styles.label}>Next ›</Text>
              </Pressable>
            )
          }
        />
      </View>
    </Carousel>
  )
}

const stepStyle = (state: CarouselStepState) => [
  styles.button,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  carousel: { width: 320, maxWidth: "100%", gap: 12 },
  viewport: { borderRadius: 12 },
  item: { width: "100%" },
  tile: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 12,
    backgroundColor: "#f4f4f5",
  },
  name: { fontSize: 20, fontWeight: "600" },
  hint: { color: "#71717a", fontSize: 13 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  button: {
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  disabled: { opacity: 0.4 },
  label: { fontSize: 14, fontWeight: "500" },
})

export { Example }
