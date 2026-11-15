import { announce } from "@ui-sdk/core"
import { AccessibilityInfo } from "react-native"
import "../src/primitive"

const announceForAccessibilityWithOptions = jest.spyOn(
  AccessibilityInfo,
  "announceForAccessibilityWithOptions"
)

afterEach(() => announceForAccessibilityWithOptions.mockClear())

describe("announce on the native host", () => {
  test("a polite announcement waits for the screen reader to finish what it says", () => {
    announce("Saved")
    expect(announceForAccessibilityWithOptions).toHaveBeenCalledTimes(1)
    expect(announceForAccessibilityWithOptions).toHaveBeenCalledWith("Saved", {
      queue: true,
    })
  })

  test("an assertive announcement interrupts it", () => {
    announce("Connection lost", { priority: "assertive" })
    expect(announceForAccessibilityWithOptions).toHaveBeenCalledWith(
      "Connection lost",
      { queue: false }
    )
  })

  test("the same text twice is said twice, and empty text not at all", () => {
    announce("Saved")
    announce("Saved")
    announce("")
    expect(announceForAccessibilityWithOptions).toHaveBeenCalledTimes(2)
  })
})
