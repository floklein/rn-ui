import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import {
  AccessibilityInfo,
  type HostInstance,
  Pressable,
  Text,
} from "react-native"
import { createCheckboxGroupController } from "@ui-sdk/core/checkbox"
import {
  Checkbox,
  CheckboxGroup,
  CheckboxIndicator,
  type CheckboxIndicatorState,
} from "../src/checkbox"

type Done = () => void

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

let seen: CheckboxIndicatorState[] = []
const record = (state: CheckboxIndicatorState) => {
  seen.push(state)
  return null
}
const last = () => seen[seen.length - 1]

beforeEach(() => {
  seen = []
  jest.useFakeTimers()
})
afterEach(() => {
  jest.useRealTimers()
  sendAccessibilityEvent.mockClear()
})

const indicator = () =>
  screen.queryByTestId("indicator", { includeHiddenElements: true })

async function renderCheckbox(
  props: {
    onExit?: (done: Done) => void
    keepMounted?: boolean
    checked?: boolean
    defaultChecked?: boolean
  } = {}
) {
  const { onExit, keepMounted, ...root } = props
  return render(
    <Checkbox aria-label="Accept" testID="checkbox" {...root}>
      <CheckboxIndicator
        testID="indicator"
        onExit={onExit}
        keepMounted={keepMounted}
      >
        {record}
      </CheckboxIndicator>
    </Checkbox>
  )
}

describe("Checkbox", () => {
  test("a press checks it and shows the indicator", async () => {
    await renderCheckbox()
    const control = screen.getByRole("checkbox")
    expect(control).not.toBeChecked()
    expect(indicator()).toBeNull()
    await fireEvent.press(control)
    expect(control).toBeChecked()
    expect(indicator()).not.toBeNull()
  })

  test("an indeterminate checkbox reports the mixed state", async () => {
    await render(<Checkbox aria-label="All" checked="indeterminate" />)
    expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(
      "mixed"
    )
  })
})

describe("CheckboxIndicator presence", () => {
  test("without onExit, it unmounts as soon as the checkbox unchecks", async () => {
    await renderCheckbox({ defaultChecked: true })
    await fireEvent.press(screen.getByRole("checkbox"))
    expect(indicator()).toBeNull()
  })

  test("with onExit, it stays mounted until done is called", async () => {
    const onExit = jest.fn<void, [Done]>()
    await renderCheckbox({ defaultChecked: true, onExit })
    await fireEvent.press(screen.getByRole("checkbox"))
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(indicator()).not.toBeNull()
    expect(last()).toMatchObject({ checked: false, endingStyle: true })
    await act(() => onExit.mock.calls[0][0]())
    expect(indicator()).toBeNull()
  })

  test("an exit nobody ends unmounts it after two seconds", async () => {
    await renderCheckbox({ defaultChecked: true, onExit: () => {} })
    await fireEvent.press(screen.getByRole("checkbox"))
    await act(() => jest.advanceTimersByTime(1999))
    expect(indicator()).not.toBeNull()
    await act(() => jest.advanceTimersByTime(1))
    expect(indicator()).toBeNull()
  })

  test("calling done twice ends the exit once, and a late call leaves a reopened indicator alone", async () => {
    const dones: Done[] = []
    await renderCheckbox({
      defaultChecked: true,
      onExit: (done) => dones.push(done),
    })
    const control = screen.getByRole("checkbox")
    await fireEvent.press(control)
    await act(() => dones[0]())
    await act(() => dones[0]())
    expect(indicator()).toBeNull()
    await fireEvent.press(control)
    await act(() => dones[0]())
    expect(indicator()).not.toBeNull()
  })

  test("checking again before done cancels the exit and its timeout", async () => {
    const dones: Done[] = []
    await renderCheckbox({
      defaultChecked: true,
      onExit: (done) => dones.push(done),
    })
    const control = screen.getByRole("checkbox")
    await fireEvent.press(control)
    await fireEvent.press(control)
    expect(last()).toMatchObject({ checked: true, endingStyle: false })
    await act(() => dones[0]())
    await act(() => jest.advanceTimersByTime(2000))
    expect(indicator()).not.toBeNull()
    expect(control).toBeChecked()
  })

  test("with keepMounted, the exit settles without unmounting", async () => {
    const dones: Done[] = []
    await renderCheckbox({
      defaultChecked: true,
      keepMounted: true,
      onExit: (done) => dones.push(done),
    })
    await fireEvent.press(screen.getByRole("checkbox"))
    expect(dones).toHaveLength(1)
    expect(last()).toMatchObject({ checked: false, endingStyle: true })
    await act(() => dones[0]())
    expect(indicator()).not.toBeNull()
    expect(last()).toMatchObject({ checked: false, endingStyle: false })
  })

  test("an exiting indicator exposes no accessible element and takes no press", async () => {
    const onPress = jest.fn()
    await render(
      <Checkbox aria-label="Accept" defaultChecked>
        <CheckboxIndicator
          onExit={() => {}}
          render={
            <Pressable
              accessibilityRole="image"
              onPress={onPress}
              testID="indicator"
            />
          }
        >
          <Text>✓</Text>
        </CheckboxIndicator>
      </Checkbox>
    )
    expect(screen.getByRole("image")).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole("checkbox"))
    expect(screen.queryByRole("image")).toBeNull()
    expect(screen.queryByText("✓")).toBeNull()
    await fireEvent.press(indicator()!)
    expect(onPress).not.toHaveBeenCalled()
  })

  test("the first-frame flag is set when it enters after mount, and clears on the next frame", async () => {
    await renderCheckbox()
    await fireEvent.press(screen.getByRole("checkbox"))
    expect(last()).toMatchObject({ checked: true, startingStyle: true })
    await act(() => jest.advanceTimersByTime(16))
    expect(last()).toMatchObject({ checked: true, startingStyle: false })
  })

  test("a checkbox checked from its first render doesn't start the indicator in its first frame", async () => {
    await renderCheckbox({ defaultChecked: true })
    expect(seen[0]).toMatchObject({ startingStyle: false, endingStyle: false })
  })
})

describe("CheckboxGroup", () => {
  // The group refreshes its checkboxes in a microtask, which fake timers hold.
  beforeEach(() => jest.useRealTimers())

  const checkbox = (name: string) => screen.getByRole("checkbox", { name })

  test("a press in the group changes the group's value, and the group's value checks its checkboxes", async () => {
    const onValueChange = jest.fn()
    const { rerender } = await render(
      <CheckboxGroup value={["tea"]} onValueChange={onValueChange}>
        <Checkbox aria-label="Tea" value="tea" />
        <Checkbox aria-label="Coffee" value="coffee" />
      </CheckboxGroup>
    )
    expect(checkbox("Tea")).toBeChecked()
    expect(checkbox("Coffee")).not.toBeChecked()
    await fireEvent.press(checkbox("Coffee"))
    expect(onValueChange.mock.calls[0][0]).toEqual(["tea", "coffee"])
    await rerender(
      <CheckboxGroup value={["coffee"]} onValueChange={onValueChange}>
        <Checkbox aria-label="Tea" value="tea" />
        <Checkbox aria-label="Coffee" value="coffee" />
      </CheckboxGroup>
    )
    expect(checkbox("Tea")).not.toBeChecked()
    expect(checkbox("Coffee")).toBeChecked()
  })

  test("a checkbox that renders later between two others takes its place in the value", async () => {
    const onValueChange = jest.fn()
    function Drinks({ coffee = true }) {
      return (
        <CheckboxGroup onValueChange={onValueChange}>
          <Checkbox aria-label="Tea" value="tea" />
          {coffee && <Checkbox aria-label="Coffee" value="coffee" />}
          <Checkbox aria-label="Milk" value="milk" />
        </CheckboxGroup>
      )
    }
    const { rerender } = await render(<Drinks coffee={false} />)
    await fireEvent.press(checkbox("Milk"))
    await rerender(<Drinks />)
    await fireEvent.press(checkbox("Coffee"))
    await fireEvent.press(checkbox("Tea"))
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["tea", "coffee", "milk"],
      expect.anything()
    )
  })

  test("a parent checks every enabled checkbox and shows mixed from them", async () => {
    await render(
      <CheckboxGroup
        defaultValue={["tea"]}
        allValues={["tea", "coffee", "milk"]}
      >
        <Checkbox aria-label="All" parent />
        <Checkbox aria-label="Tea" value="tea" />
        <Checkbox aria-label="Coffee" value="coffee" />
        <Checkbox aria-label="Milk" value="milk" disabled />
      </CheckboxGroup>
    )
    expect(checkbox("All").props.accessibilityState.checked).toBe("mixed")
    await fireEvent.press(checkbox("All"))
    expect(checkbox("Tea")).toBeChecked()
    expect(checkbox("Coffee")).toBeChecked()
    expect(checkbox("Milk")).not.toBeChecked()
  })

  test("the group's controller focuses its first enabled checkbox", async () => {
    const controller = createCheckboxGroupController()
    const coffee = createRef<HostInstance>()
    await render(
      <CheckboxGroup controller={controller}>
        <Checkbox aria-label="Tea" value="tea" disabled />
        <Checkbox aria-label="Coffee" value="coffee" ref={coffee} />
      </CheckboxGroup>
    )
    await act(() => controller.focus())
    expect(sendAccessibilityEvent).toHaveBeenCalledTimes(1)
    expect(sendAccessibilityEvent.mock.calls[0][0] === coffee.current).toBe(
      true
    )
  })
})
