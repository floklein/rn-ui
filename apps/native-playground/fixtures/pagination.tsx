import {
  createPaginationController,
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  type PaginationLinkState,
  type PaginationStepState,
} from "@ui-sdk/react-native/pagination"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const stepStyle = (state: PaginationStepState) => [
  styles.page,
  state.disabled && styles.disabled,
]

const pageStyle = (state: PaginationLinkState) => [
  styles.page,
  state.current && styles.current,
]

function Fixture() {
  const [value, setValue] = useState("none")
  const [controller] = useState(() => createPaginationController())

  return (
    <View style={styles.fixture}>
      <Text testID="page-value">{value}</Text>
      <Pressable
        accessibilityRole="button"
        testID="set-page"
        onPress={() => controller.setPage(7)}
        style={styles.action}
      >
        <Text>Go to Page 7</Text>
      </Pressable>
      <Pagination
        aria-label="Results"
        pageCount={12}
        controller={controller}
        onPageChange={(page, details) =>
          setValue(`${page}:${details.reason}:${details.source}`)
        }
      >
        <PaginationList style={styles.list}>
          {({ items }) => (
            <>
              <PaginationItem>
                <PaginationFirst
                  aria-label="First"
                  testID="first"
                  style={stepStyle}
                >
                  <Text>«</Text>
                </PaginationFirst>
              </PaginationItem>
              <PaginationItem>
                <PaginationPrevious
                  aria-label="Previous"
                  testID="previous"
                  style={stepStyle}
                >
                  <Text>‹</Text>
                </PaginationPrevious>
              </PaginationItem>
              {items.map((item) => (
                <PaginationItem key={item}>
                  {typeof item === "number" ? (
                    <PaginationLink page={item} style={pageStyle} />
                  ) : (
                    <PaginationEllipsis testID={item} style={styles.gap} />
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  aria-label="Next"
                  testID="next"
                  style={stepStyle}
                >
                  <Text>›</Text>
                </PaginationNext>
              </PaginationItem>
              <PaginationItem>
                <PaginationLast
                  aria-label="Last"
                  testID="last"
                  style={stepStyle}
                >
                  <Text>»</Text>
                </PaginationLast>
              </PaginationItem>
            </>
          )}
        </PaginationList>
      </Pagination>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 12 },
  action: {
    alignSelf: "flex-start",
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
  list: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  page: {
    minWidth: 28,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  current: { borderWidth: 1, borderColor: "#a1a1aa" },
  disabled: { opacity: 0.4 },
  gap: { width: 16, textAlign: "center" },
})

export { Fixture }
