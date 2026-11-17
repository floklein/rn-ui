import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselStepState,
  CarouselViewport,
  createCarouselController,
} from "@ui-sdk/react-native/carousel"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const slides = [1, 2, 3, 4, 5]

function Example() {
  const [carousel] = useState(createCarouselController)
  return (
    <View style={styles.stack}>
      <View style={styles.controls}>
        <CarouselPrevious
          controller={carousel}
          aria-label="Previous slide"
          style={stepStyle}
        >
          <Text style={styles.arrow}>‹</Text>
        </CarouselPrevious>
        <CarouselNext
          controller={carousel}
          aria-label="Next slide"
          style={stepStyle}
        >
          <Text style={styles.arrow}>›</Text>
        </CarouselNext>
        <Pressable
          accessibilityRole="button"
          onPress={() => carousel.setPage(5)}
          style={styles.button}
        >
          <Text style={styles.label}>Show the Last Slide</Text>
        </Pressable>
      </View>
      <Carousel aria-label="Featured" controller={carousel} drag={false}>
        <CarouselViewport style={styles.viewport}>
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide} style={styles.item}>
                <View style={styles.tile}>
                  <Text style={styles.number}>{slide}</Text>
                </View>
              </CarouselItem>
            ))}
          </CarouselContent>
        </CarouselViewport>
      </Carousel>
    </View>
  )
}

const stepStyle = (state: CarouselStepState) => [
  styles.step,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  stack: { width: 320, maxWidth: "100%", gap: 12 },
  controls: { flexDirection: "row", alignItems: "center", gap: 8 },
  viewport: { borderRadius: 12 },
  item: { width: "100%" },
  tile: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#f4f4f5",
  },
  number: { fontSize: 32, fontWeight: "600" },
  step: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  disabled: { opacity: 0.4 },
  arrow: { fontSize: 22 },
  button: {
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  label: { fontSize: 14, fontWeight: "500" },
})

export { Example }
