import { Listbox, ListboxItem } from "@ui-sdk/react-native/listbox"
import { Pressable, StyleSheet, Text } from "react-native"

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "nuxt", label: "Nuxt" },
  { value: "sveltekit", label: "SvelteKit" },
]

function Example() {
  return (
    <Listbox
      defaultValue="next"
      aria-label="Framework docs"
      style={styles.list}
    >
      {frameworks.map((framework) => (
        <ListboxItem
          key={framework.value}
          value={framework.value}
          label={framework.label}
          render={(props, state) => (
            <Pressable
              {...props}
              style={[styles.item, state.selected && styles.selected]}
            />
          )}
        >
          {(state) => (
            <>
              <Text style={styles.itemText}>{framework.label}</Text>
              {state.selected && (
                <Text aria-hidden style={styles.hint}>
                  Open ↗
                </Text>
              )}
            </>
          )}
        </ListboxItem>
      ))}
    </Listbox>
  )
}

const styles = StyleSheet.create({
  hint: { fontSize: 13, color: "#71717a" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  itemText: { fontSize: 16 },
  list: {
    width: 260,
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  selected: { backgroundColor: "#e4e4e7" },
})

export { Example }
