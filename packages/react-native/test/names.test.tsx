import { render, screen } from "@testing-library/react-native"
import { definePrimitive } from "@ui-sdk/core"
import { Pressable, Text, View } from "react-native"
import { createParts } from "../src/primitive"

const card = definePrimitive({
  name: "card",
  state: () => ({}),
  api: () => ({}),
  slots: (slot) => ({
    root: slot({}),
    text: slot<{ id?: string }>({
      props: { id: "string" },
      attrs: (_state, { props }) => ({ id: props.id }),
    }),
    action: slot({ attrs: () => ({ role: "button" }), press: () => {} }),
  }),
})

const parts = createParts(card, {
  root: View,
  text: Text,
  action: Pressable,
})

const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
afterEach(() => warn.mockClear())

const props = (testID: string) => screen.getByTestId(testID).props

describe("names from referenced parts", () => {
  test("a label joins the referenced texts in order, follows them as they change and clears when one unmounts", async () => {
    const view = (title: string, unit = true) => (
      <parts.Root>
        <parts.Action
          testID="action"
          aria-labelledby="title unit"
          aria-describedby="hint"
        />
        <parts.Text id="title">{title}</parts.Text>
        {unit && <parts.Text id="unit">{["in ", 3, " days"]}</parts.Text>}
        <parts.Text id="hint">Opens the invoice</parts.Text>
      </parts.Root>
    )
    const { rerender } = await render(view("Due"))
    expect(props("action").accessibilityLabel).toBe("Due in 3 days")
    expect(props("action").accessibilityHint).toBe("Opens the invoice")
    await rerender(view("Paid"))
    expect(props("action").accessibilityLabel).toBe("Paid in 3 days")
    await rerender(view("Paid", false))
    expect(props("action").accessibilityLabel).toBeUndefined()
  })

  test("content that isn't plain text gives no partial name, and the part's own aria-label stays", async () => {
    await render(
      <parts.Root>
        <parts.Action
          testID="action"
          aria-label="Invoice"
          aria-labelledby="title unit"
        />
        <parts.Text id="title">Due</parts.Text>
        <parts.Text id="unit">
          in <Text>3</Text> days
        </parts.Text>
      </parts.Root>
    )
    expect(props("action").accessibilityLabel).toBe("Invoice")
  })

  test("a container gets no label and no warning", async () => {
    await render(
      <parts.Root testID="root" aria-labelledby="title missing">
        <parts.Text id="title">Invoices</parts.Text>
      </parts.Root>
    )
    expect(props("root").accessibilityLabel).toBeUndefined()
    await new Promise((resolve) => setTimeout(resolve))
    expect(warn).not.toHaveBeenCalled()
  })

  test("development warns about an id that resolves to nothing", async () => {
    await render(
      <parts.Root>
        <parts.Action testID="action" aria-labelledby="title missing" />
        <parts.Text id="title">Due</parts.Text>
      </parts.Root>
    )
    await new Promise((resolve) => setTimeout(resolve))
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0].join(" ")).toContain('"missing"')
  })
})
