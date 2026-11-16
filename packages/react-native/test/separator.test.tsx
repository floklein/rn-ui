import { render, screen } from "@testing-library/react-native"
import { View } from "react-native"
import { Separator, type SeparatorState } from "../src/separator"

const separator = () =>
  screen.getByTestId("separator", { includeHiddenElements: true })

describe("Separator", () => {
  test("renders a view that a screen reader and the keyboard pass over", async () => {
    await render(<Separator testID="separator" />)
    expect(separator().type).toBe("View")
    expect(separator().props.accessible).toBeUndefined()
    expect(separator().props.focusable).toBeUndefined()
    expect(separator().props.accessibilityRole).toBeUndefined()
  })

  test("a decorative separator has no role, for either platform", async () => {
    await render(<Separator decorative testID="separator" />)
    expect(separator().props.accessibilityRole).toBe("none")
  })

  test("its style receives the orientation, horizontal by default", async () => {
    const style = jest.fn((state: SeparatorState) => ({
      width: state.orientation === "vertical" ? 1 : "100%",
    }))
    const { rerender } = await render(
      <Separator testID="separator" style={style} />
    )
    expect(style.mock.lastCall?.[0].orientation).toBe("horizontal")
    await rerender(
      <Separator testID="separator" orientation="vertical" style={style} />
    )
    expect(style.mock.lastCall?.[0].orientation).toBe("vertical")
    expect(separator().props.style).toEqual({ width: 1 })
  })

  test("passes no orientation or ARIA prop to its view", async () => {
    await render(
      <Separator testID="separator" orientation="vertical" decorative />
    )
    expect(
      Object.keys(separator().props).filter((name) =>
        /^(aria-|role$|orientation$|decorative$)/.test(name)
      )
    ).toEqual([])
  })

  test("renders another host through render", async () => {
    await render(
      <Separator
        testID="separator"
        render={(props) => <View {...props} pointerEvents="none" />}
      />
    )
    expect(separator().props.pointerEvents).toBe("none")
  })
})
