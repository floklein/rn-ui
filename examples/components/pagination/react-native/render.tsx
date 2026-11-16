import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "@ui-sdk/react-native/pagination"
import { Pressable, StyleSheet, Text } from "react-native"

function Example() {
  return (
    <Pagination aria-label="Pagination" pageCount={10}>
      <PaginationList style={styles.list}>
        {({ items }) => (
          <>
            <PaginationItem>
              <PaginationPrevious
                aria-label="Previous page"
                render={(props, state) => (
                  <Pressable
                    {...props}
                    accessibilityHint={
                      state.disabled ? undefined : `Goes to page ${state.page}`
                    }
                    style={[styles.step, state.disabled && styles.disabled]}
                  />
                )}
              >
                {(state) => (
                  <Text style={styles.label}>
                    ← {state.disabled ? "" : state.page}
                  </Text>
                )}
              </PaginationPrevious>
            </PaginationItem>
            {items.map((item) => (
              <PaginationItem key={item}>
                {typeof item === "number" ? (
                  <PaginationLink page={item} style={styles.page}>
                    {(state) => (
                      <Text style={state.current && styles.current}>
                        {state.current ? `Page ${state.page}` : state.page}
                      </Text>
                    )}
                  </PaginationLink>
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                aria-label="Next page"
                render={(props, state) => (
                  <Pressable
                    {...props}
                    accessibilityHint={
                      state.disabled ? undefined : `Goes to page ${state.page}`
                    }
                    style={[styles.step, state.disabled && styles.disabled]}
                  />
                )}
              >
                {(state) => (
                  <Text style={styles.label}>
                    {state.disabled ? "" : state.page} →
                  </Text>
                )}
              </PaginationNext>
            </PaginationItem>
          </>
        )}
      </PaginationList>
    </Pagination>
  )
}

const styles = StyleSheet.create({
  list: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  step: { paddingHorizontal: 8, paddingVertical: 6 },
  disabled: { opacity: 0.4 },
  label: { fontSize: 16 },
  page: { paddingHorizontal: 6, paddingVertical: 6 },
  current: { fontWeight: "600" },
})

export { Example }
