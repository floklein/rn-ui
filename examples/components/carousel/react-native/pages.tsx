import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselIndicatorGroup,
  type CarouselIndicatorState,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselStepState,
  CarouselViewport,
} from "@ui-sdk/react-native/carousel"
import { StyleSheet, Text, View } from "react-native"

const products = [1, 2, 3, 4, 5, 6, 7, 8]

function Example() {
  return (
    <Carousel aria-label="Products" slidesPerPage={3} style={styles.carousel}>
      <View style={styles.row}>
        <CarouselPrevious aria-label="Previous page" style={stepStyle}>
          <Text style={styles.arrow}>‹</Text>
        </CarouselPrevious>
        <CarouselViewport style={styles.viewport}>
          <CarouselContent>
            {products.map((product) => (
              <CarouselItem key={product} style={styles.item}>
                <View style={styles.tile}>
                  <Text style={styles.number}>{product}</Text>
                </View>
              </CarouselItem>
            ))}
          </CarouselContent>
        </CarouselViewport>
        <CarouselNext aria-label="Next page" style={stepStyle}>
          <Text style={styles.arrow}>›</Text>
        </CarouselNext>
      </View>
      <CarouselIndicatorGroup aria-label="Choose a page" style={styles.dots}>
        {(state) =>
          Array.from({ length: state.pageCount ?? 3 }, (_, index) => (
            <CarouselIndicator
              key={index}
              page={index + 1}
              aria-label={`Page ${index + 1}`}
              hitSlop={8}
              style={dotStyle}
            />
          ))
        }
      </CarouselIndicatorGroup>
    </Carousel>
  )
}

const stepStyle = (state: CarouselStepState) => [
  styles.step,
  state.disabled && styles.disabled,
]

const dotStyle = (state: CarouselIndicatorState) => [
  styles.dot,
  state.selected && styles.selected,
]

const styles = StyleSheet.create({
  carousel: { width: 320, maxWidth: "100%", gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  viewport: { flex: 1, borderRadius: 12 },
  item: { width: "33.333%", paddingHorizontal: 4 },
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
  dots: { flexDirection: "row", justifyContent: "center", gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#d4d4d8" },
  selected: { backgroundColor: "#18181b" },
})

export { Example }
