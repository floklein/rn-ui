import { render, screen } from "@testing-library/react-native"
import { Platform } from "react-native"
import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
  type MeterState,
} from "../src/meter"

const hidden = { includeHiddenElements: true }

function Storage({ value }: { value: number }) {
  return (
    <Meter value={value} max={256} testID="meter">
      <MeterLabel>Storage used</MeterLabel>
      <MeterValue testID="value" />
      <MeterTrack testID="track">
        <MeterIndicator testID="indicator" />
      </MeterTrack>
    </Meter>
  )
}

describe("Meter", () => {
  test("is one element a screen reader reads with its value", async () => {
    await render(<Storage value={64} />)
    const meter = screen.getByTestId("meter")
    expect(meter.props.accessibilityRole).toBe("progressbar")
    expect(meter.props.accessible).toBe(Platform.OS === "ios" || undefined)
    expect(meter.props.accessibilityValue).toEqual({
      min: 0,
      max: 256,
      now: 64,
      text: "25%",
    })
  })

  test("shows the formatted value, hidden from screen readers", async () => {
    await render(<Storage value={64} />)
    expect(screen.getByTestId("value", hidden).props.children).toBe("25%")
    expect(screen.queryByText("25%")).toBeNull()
    expect(screen.getByText("Storage used")).toBeOnTheScreen()
  })

  test("its indicator is as wide as the value, clamped to the track", async () => {
    const { rerender } = await render(<Storage value={64} />)
    expect(screen.getByTestId("indicator").props.style).toEqual({
      start: 0,
      width: "25%",
    })
    await rerender(<Storage value={300} />)
    expect(screen.getByTestId("indicator").props.style).toEqual({
      start: 0,
      width: "100%",
    })
    expect(screen.getByTestId("meter").props.accessibilityValue.now).toBe(256)
  })

  test("its parts' styles receive the value as given and its percent", async () => {
    const style = jest.fn((state: MeterState) => ({
      opacity: state.percent / 100,
    }))
    await render(
      <Meter value={-5} min={-10} max={10}>
        <MeterTrack style={style} />
      </Meter>
    )
    expect(style.mock.lastCall?.[0]).toEqual({ value: -5, percent: 25 })
  })

  test("a unit format reads the value itself", async () => {
    await render(
      <Meter
        value={64}
        max={256}
        format={{ style: "unit", unit: "gigabyte" }}
        testID="meter"
      >
        <MeterValue testID="value" />
      </Meter>
    )
    expect(screen.getByTestId("value", hidden).props.children).toBe("64 GB")
    expect(screen.getByTestId("meter").props.accessibilityValue.text).toBe(
      "64 GB"
    )
  })
})
