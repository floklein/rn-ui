import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  type PaginationLinkState,
  type PaginationStepState,
} from "@ui-sdk/react-native/pagination"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const sizes = [10, 20, 50]
const total = 95

const stepStyle = (state: PaginationStepState) => [
  styles.page,
  state.disabled && styles.disabled,
]

const pageStyle = (state: PaginationLinkState) => [
  styles.page,
  state.current && styles.current,
]

function Example() {
  const log = useLog()
  const [page, setPage] = useState(2)
  const [pageSize, setPageSize] = useState(20)

  return (
    <View style={styles.stack}>
      <Text>
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}{" "}
        of {total}
      </Text>
      <View style={styles.row}>
        <Text>Rows per page</Text>
        {sizes.map((size) => (
          <Pressable
            key={size}
            accessibilityRole="button"
            accessibilityState={{ selected: size === pageSize }}
            onPress={() => {
              setPageSize(size)
              setPage(1)
              log(`${size} rows per page`)
            }}
            style={[styles.size, size === pageSize && styles.current]}
          >
            <Text>{size}</Text>
          </Pressable>
        ))}
      </View>
      <Pagination
        aria-label="Pagination"
        total={total}
        pageSize={pageSize}
        page={page}
        onPageChange={(next) => {
          setPage(next)
          log(`Page ${next}`)
        }}
      >
        <PaginationList style={styles.list}>
          {({ items }) => (
            <>
              <PaginationItem>
                <PaginationPrevious aria-label="Previous" style={stepStyle}>
                  <Text style={styles.label}>‹</Text>
                </PaginationPrevious>
              </PaginationItem>
              {items.map((item) => (
                <PaginationItem key={item}>
                  {typeof item === "number" ? (
                    <PaginationLink page={item} style={pageStyle}>
                      <Text style={styles.label}>{item}</Text>
                    </PaginationLink>
                  ) : (
                    <PaginationEllipsis style={styles.ellipsis} />
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext aria-label="Next" style={stepStyle}>
                  <Text style={styles.label}>›</Text>
                </PaginationNext>
              </PaginationItem>
            </>
          )}
        </PaginationList>
      </Pagination>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  size: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  list: { flexDirection: "row", alignItems: "center", gap: 4 },
  page: {
    minWidth: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  current: { borderWidth: 1, borderColor: "#d4d4d8" },
  disabled: { opacity: 0.4 },
  label: { fontSize: 16 },
  ellipsis: { width: 24, textAlign: "center", fontSize: 16 },
})

export { Example }
