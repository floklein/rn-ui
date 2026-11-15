import { render, screen } from "@testing-library/react-native"
import { definePrimitive } from "@ui-sdk/core"
import { Pressable, View } from "react-native"
import { createParts } from "../src/primitive"

const outline = definePrimitive({
  name: "outline",
  state: () => ({}),
  api: () => ({}),
  slots: (slot) => ({
    root: slot({
      attrs: () => ({
        role: "tree",
        "aria-activedescendant": "item",
        "aria-owns": "item",
      }),
    }),
    item: slot({
      attrs: () => ({
        role: "treeitem",
        tabindex: "-1",
        "aria-checked": "true",
        "aria-expanded": "false",
        "aria-controls": "group",
      }),
      press: () => {},
    }),
  }),
})

const parts = createParts(outline, { root: View, item: Pressable })

describe("a part's accessibility props", () => {
  test("a user's accessibilityState merges over the translated one, field by field", async () => {
    await render(
      <parts.Root>
        <parts.Item testID="item" accessibilityState={{ busy: true }} />
      </parts.Root>
    )
    expect(screen.getByTestId("item").props.accessibilityState).toEqual({
      checked: true,
      expanded: false,
      busy: true,
    })
  })

  test("a user's role and aria-* are translated and consumed, reaching neither the host nor render", async () => {
    let received: Record<string, unknown> = {}
    await render(
      <parts.Root testID="root" role="list" aria-label="Files">
        <parts.Item
          aria-label="Notes"
          aria-hidden
          render={(props: Record<string, unknown>) => {
            received = props
            return <Pressable {...props} testID="item" />
          }}
        />
      </parts.Root>
    )
    const root = screen.getByTestId("root", { includeHiddenElements: true })
    expect(root.props.accessibilityLabel).toBe("Files")
    expect(received.accessibilityLabel).toBe("Notes")
    for (const props of [root.props, received]) {
      expect(
        Object.keys(props).filter((name) => /^(role$|aria-)/.test(name))
      ).toEqual([])
    }
  })

  test("aria-controls, aria-owns and aria-activedescendant are dropped", async () => {
    await render(
      <parts.Root testID="root">
        <parts.Item testID="item" />
      </parts.Root>
    )
    for (const id of ["root", "item"]) {
      const { accessibilityState, ...props } = screen.getByTestId(id).props
      expect(
        Object.keys({ ...props, ...accessibilityState }).filter((name) =>
          /controls|owns|activedescendant|labelledBy/i.test(name)
        )
      ).toEqual([])
    }
  })

  test("an item with tabindex -1 stays in keyboard traversal", async () => {
    await render(
      <parts.Root>
        <parts.Item testID="item" />
      </parts.Root>
    )
    const props = screen.getByTestId("item").props
    expect(props.focusable).not.toBe(false)
    expect(props.tabIndex).toBeUndefined()
    expect(props.tabindex).toBeUndefined()
  })
})
