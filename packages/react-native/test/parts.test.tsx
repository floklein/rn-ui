import { fireEvent, render, screen } from "@testing-library/react-native"
import { switchPrimitive } from "@ui-sdk/core/switch"
import { createRef } from "react"
import { Pressable, Text, View, type HostInstance } from "react-native"
import type { TestInstance } from "test-renderer"
import { createParts, type Interaction } from "../src/primitive"
import { Toggle, ToggleGroup, ToggleIcon } from "../src/toggle"

const parts = createParts(switchPrimitive, { root: Pressable, thumb: View })

function hostProps(node: TestInstance = screen.container) {
  const found: Record<string, unknown>[] = []
  for (const child of node.children) {
    if (typeof child !== "string") {
      found.push(child.props, ...hostProps(child))
    }
  }
  return found
}

const holdsFunction = (value: unknown): boolean =>
  typeof value === "function" ||
  (Array.isArray(value) && value.some(holdsFunction))

describe("a part's props", () => {
  test("style, class name and children functions resolve, so a host never receives a function", async () => {
    await render(
      <parts.Root
        testID="root"
        style={(state) => ({ opacity: state.checked ? 1 : 0.5 })}
        className={(state) => (state.checked ? "on" : "off")}
      >
        {(state) => <Text>{state.checked ? "On" : "Off"}</Text>}
      </parts.Root>
    )
    const props = screen.getByTestId("root").props
    expect(holdsFunction(props.style)).toBe(false)
    expect(props.className).toBe("off")
    expect(screen.getByText("Off")).toBeOnTheScreen()
    for (const host of hostProps()) {
      for (const [name, value] of Object.entries(host)) {
        if (name !== "children" && !/^on[A-Z]/.test(name) && name !== "ref") {
          expect([name, holdsFunction(value)]).toEqual([name, false])
        }
      }
    }
  })

  test("a style that isn't a plain object reaches the host as it is, never flattened", async () => {
    const list = [{ padding: 1 }, { margin: 2 }]
    await render(<parts.Root testID="root" style={list} />)
    const style = screen.getByTestId("root").props.style
    expect(style).not.toEqual({ padding: 1, margin: 2 })
    expect(JSON.stringify(style)).toContain(JSON.stringify(list))
  })

  test("styles merge as an array in the order props merge", async () => {
    const own = { padding: 1 }
    const outer = { margin: 2 }
    await render(
      <parts.Root
        testID="root"
        style={outer}
        render={<Pressable style={own} />}
      />
    )
    expect(screen.getByTestId("root").props.style).toEqual([outer, own])
  })

  test("interaction.pressed reaches style, className, children and render", async () => {
    const seen: Record<string, Interaction[]> = {
      style: [],
      className: [],
      children: [],
      render: [],
    }
    await render(
      <parts.Root
        testID="root"
        style={(_state, interaction) => {
          seen.style.push(interaction)
          return undefined
        }}
        className={(_state, interaction) => {
          seen.className.push(interaction)
          return undefined
        }}
        render={(props, _state, interaction) => {
          seen.render.push(interaction)
          return <Pressable {...props} />
        }}
      >
        {(_state, interaction) => {
          seen.children.push(interaction)
          return null
        }}
      </parts.Root>
    )
    await fireEvent(screen.getByTestId("root"), "pressIn")
    for (const [name, interactions] of Object.entries(seen)) {
      expect([name, interactions.at(0)?.pressed]).toEqual([name, false])
      expect([name, interactions.at(-1)?.pressed]).toEqual([name, true])
    }
    await fireEvent(screen.getByTestId("root"), "pressOut")
    expect(seen.style.at(-1)?.pressed).toBe(false)
  })

  test("no dataSet or data-* prop reaches a host", async () => {
    await render(
      <parts.Root defaultChecked readOnly required>
        <parts.Thumb style={(state) => ({ opacity: state.checked ? 1 : 0 })} />
      </parts.Root>
    )
    for (const host of hostProps()) {
      expect(Object.keys(host).filter((name) => /^data/i.test(name))).toEqual(
        []
      )
    }
  })

  test("the part forwards the resolved className, a merged ref, disabled and unknown props", async () => {
    const ref = createRef<HostInstance>()
    const own = createRef<HostInstance>()
    await render(
      <parts.Root
        ref={ref}
        className="switch"
        disabled
        hitSlop={4}
        testID="root"
        render={<Pressable ref={own} />}
      />
    )
    const props = screen.getByTestId("root").props
    expect(props.className).toBe("switch")
    expect(props.hitSlop).toBe(4)
    expect(props.accessibilityState).toMatchObject({ disabled: true })
    expect(ref.current).not.toBeNull()
    expect(own.current).toBe(ref.current)
  })

  test("render receives native props ready for a react-native host, with no role or aria-*", async () => {
    let received: Record<string, unknown> = {}
    await render(
      <parts.Root
        role="switch"
        aria-label="Wi-Fi"
        render={(props) => {
          received = props
          return <Pressable {...props} testID="root" />
        }}
      />
    )
    expect(received).toMatchObject({
      accessibilityRole: "switch",
      accessibilityLabel: "Wi-Fi",
      accessibilityState: { checked: false },
    })
    expect(
      Object.keys(received).filter((name) => /^(role|aria-)/.test(name))
    ).toEqual([])
    expect(typeof received.onPress).toBe("function")
  })

  test("a host prop the user passes runs with the part's own", async () => {
    const onPress = jest.fn()
    const onCheckedChange = jest.fn()
    await render(
      <parts.Root
        testID="root"
        onPress={onPress}
        onCheckedChange={onCheckedChange}
      />
    )
    await fireEvent.press(screen.getByTestId("root"))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
  })

  test("a container with a role or a label survives view flattening, and a pressed part is left as it is", async () => {
    let pressed: Record<string, unknown> = {}
    await render(
      <ToggleGroup aria-label="Text formatting" testID="group">
        <Toggle aria-label="Bold">
          <ToggleIcon testID="icon" />
        </Toggle>
      </ToggleGroup>
    )
    expect(screen.getByTestId("group").props.collapsable).toBe(false)
    expect(
      screen.getByTestId("icon", { includeHiddenElements: true }).props
        .collapsable
    ).toBeUndefined()
    await render(
      <parts.Root
        aria-label="Wi-Fi"
        render={(props) => {
          pressed = props
          return <View {...props} />
        }}
      />
    )
    expect(pressed.accessibilityRole).toBe("switch")
    expect("collapsable" in pressed).toBe(false)
  })

  test("a part with no role or label can still be flattened", async () => {
    await render(
      <parts.Root aria-label="Wi-Fi">
        <parts.Thumb testID="thumb" />
      </parts.Root>
    )
    expect(screen.getByTestId("thumb").props.collapsable).toBeUndefined()
  })

  test("the user's collapsable wins", async () => {
    await render(
      <ToggleGroup aria-label="Text formatting" testID="group" collapsable />
    )
    expect(screen.getByTestId("group").props.collapsable).toBe(true)
  })
})
