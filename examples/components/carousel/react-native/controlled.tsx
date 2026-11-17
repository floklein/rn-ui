import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselStepState,
  CarouselViewport,
} from "@ui-sdk/react-native/carousel"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const slides = [1, 2, 3, 4, 5]

function Example() {
  const [page, setPage] = useState(1)
  const log = useLog()
  return (
    <Carousel
      aria-label="Featured"
      page={page}
      onPageChange={(next, details) => {
        setPage(next)
        log(`Page ${next} (${details.reason})`)
      }}
      style={styles.carousel}
    >
      <View style={styles.row}>
        <CarouselPrevious aria-label="Previous slide" style={stepStyle}>
          <Text style={styles.arrow}>‹</Text>
        </CarouselPrevious>
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
        <CarouselNext aria-label="Next slide" style={stepStyle}>
          <Text style={styles.arrow}>›</Text>
        </CarouselNext>
      </View>
    </Carousel>
  )
}

const stepStyle = (state: CarouselStepState) => [
  styles.step,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  carousel: { width: 320, maxWidth: "100%" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  viewport: { flex: 1, borderRadius: 12 },
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
})

export { Example }
