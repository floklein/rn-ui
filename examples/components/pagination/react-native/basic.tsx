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
import { StyleSheet, Text } from "react-native"
import { useLog } from "../../../shared/react/log"

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

  return (
    <Pagination
      aria-label="Pagination"
      pageCount={10}
      onPageChange={(page, details) => log(`Page ${page} (${details.reason})`)}
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
  )
}

const styles = StyleSheet.create({
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
