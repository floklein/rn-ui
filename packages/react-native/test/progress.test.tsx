import { render, screen } from "@testing-library/react-native"
import { Platform } from "react-native"
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
  type ProgressState,
} from "../src/progress"

const hidden = { includeHiddenElements: true }
const empty = Platform.OS === "android" ? { text: "" } : {}

function Upload({ value }: { value: number | null }) {
  return (
    <Progress value={value} testID="progress">
      <ProgressLabel>Uploading photos</ProgressLabel>
      <ProgressValue testID="value" />
      <ProgressTrack testID="track">
        <ProgressIndicator testID="indicator" />
      </ProgressTrack>
    </Progress>
  )
}

describe("Progress", () => {
  test("is one progress bar element with its value", async () => {
    await render(<Upload value={60} />)
    const bar = screen.getByTestId("progress")
    expect(bar.props.accessibilityRole).toBe("progressbar")
    expect(bar.props.accessible).toBe(Platform.OS === "ios" || undefined)
    expect(bar.props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 60,
      text: "60%",
    })
    expect(screen.getByText("Uploading photos")).toBeOnTheScreen()
  })

  test("shows the formatted value, which screen readers hear from the bar only", async () => {
    await render(<Upload value={60} />)
    const value = screen.getByTestId("value", hidden)
    expect(value.props.children).toBe("60%")
    expect(screen.queryByText("60%")).toBeNull()
  })

  test("its indicator is as wide as the value, from the track's start", async () => {
    const { rerender } = await render(<Upload value={60} />)
    expect(screen.getByTestId("indicator").props.style).toEqual({
      start: 0,
      width: "60%",
    })
    await rerender(<Upload value={null} />)
    expect(screen.getByTestId("indicator").props.style).toBeUndefined()
  })

  test("an indeterminate bar has no value to read", async () => {
    await render(<Upload value={null} />)
    expect(screen.getByTestId("progress").props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      ...empty,
    })
    expect(screen.getByTestId("value", hidden).props.children).toBe("")
  })

  test("every part's style receives the status", async () => {
    const style = jest.fn((state: ProgressState) => ({
      opacity: state.status === "complete" ? 1 : 0.5,
    }))
    const { rerender } = await render(
      <Progress value={null}>
        <ProgressTrack style={style} />
      </Progress>
    )
    expect(style.mock.lastCall?.[0].status).toBe("indeterminate")
    await rerender(
      <Progress value={40}>
        <ProgressTrack style={style} />
      </Progress>
    )
    expect(style.mock.lastCall?.[0]).toEqual({
      value: 40,
      percent: 40,
      status: "progressing",
    })
    await rerender(
      <Progress value={100}>
        <ProgressTrack style={style} />
      </Progress>
    )
    expect(style.mock.lastCall?.[0].status).toBe("complete")
  })

  test("the value's children replace the formatted value", async () => {
    await render(
      <Progress value={3} max={12}>
        <ProgressValue testID="value">
          {(state) => `${state.text} copied`}
        </ProgressValue>
      </Progress>
    )
    expect(screen.getByTestId("value", hidden).props.children).toBe(
      "25% copied"
    )
  })

  test("getValueLabel and format change what the bar reads", async () => {
    await render(
      <Progress
        value={45}
        max={60}
        format={(minutes) => `${60 - minutes} min left`}
        getValueLabel={(value, details) =>
          `${details.formatted}, ${value} of ${details.max}`
        }
        testID="progress"
      />
    )
    expect(screen.getByTestId("progress").props.accessibilityValue).toEqual({
      min: 0,
      max: 60,
      now: 45,
      text: "15 min left, 45 of 60",
    })
  })

  test("formats in its locale", async () => {
    await render(
      <Progress value={40} locale="de-DE" testID="progress">
        <ProgressValue testID="value" />
      </Progress>
    )
    expect(screen.getByTestId("value", hidden).props.children).toBe("40\u00a0%")
  })

  test("passes no ARIA or data props to its views", async () => {
    await render(<Upload value={60} />)
    for (const id of ["progress", "track", "indicator"]) {
      expect(
        Object.keys(screen.getByTestId(id, hidden).props).filter((name) =>
          /^(aria-|role$|data-)/.test(name)
        )
      ).toEqual([])
    }
  })
})
