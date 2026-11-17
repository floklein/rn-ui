import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { carousel } from "@ui-sdk/core/carousel"
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native"
import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselIndicatorGroup,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselViewport,
  type CarouselOptions,
} from "../src/carousel"
import { checkCreation, checkDirection, checkPattern } from "../src/testing"

const os = Platform.OS === "android" ? "android" : "ios"

const hidden = { includeHiddenElements: true }
const slides = ["Lake", "Forest", "Desert"]

function Photos(props: CarouselOptions) {
  return (
    <Carousel aria-label="Photos" {...props}>
      <CarouselViewport testID="viewport">
        <CarouselContent testID="content">
          {slides.map((name) => (
            <CarouselItem key={name} testID={name}>
              <Text>{name}</Text>
            </CarouselItem>
          ))}
        </CarouselContent>
      </CarouselViewport>
      <CarouselPrevious aria-label="Previous slide" />
      <CarouselNext aria-label="Next slide" />
      <CarouselIndicatorGroup aria-label="Slides">
        {slides.map((name) => (
          <CarouselIndicator key={name} aria-label={name} />
        ))}
      </CarouselIndicatorGroup>
    </Carousel>
  )
}

const layout = (x: number, width: number) => ({
  nativeEvent: { layout: { x, y: 0, width, height: 200 } },
})

// Jest's views don't lay out: each reports what a device would.
async function layOut() {
  await fireEvent(screen.getByTestId("viewport"), "layout", layout(0, 300))
  await fireEvent(
    screen.getByTestId("content", hidden),
    "layout",
    layout(0, 300)
  )
  for (const [index, name] of slides.entries()) {
    await fireEvent(
      screen.getByTestId(name, hidden),
      "layout",
      layout(index * 300, 300)
    )
  }
  await act(async () => {})
}

const translateX = () => {
  const style = [screen.getByTestId("content", hidden).props.style].flat(9)
  const transform = style.find((entry) => entry?.transform)?.transform
  return transform?.[0]?.translateX + 0
}

const at = (x: number, y = 100) => ({
  nativeEvent: { pageX: x, pageY: y, identifier: 1, touches: [] },
})

async function drag(...xs: number[]) {
  const viewport = screen.getByTestId("viewport")
  const [first, ...rest] = xs
  await fireEvent(viewport, "responderGrant", at(first))
  for (const x of rest) {
    await act(async () => jest.advanceTimersByTime(16))
    await fireEvent(viewport, "responderMove", at(x))
  }
  return viewport
}

const settle = () => act(async () => jest.advanceTimersByTime(2000))

describe("Carousel", () => {
  test("Next pages once the views have laid out", async () => {
    const onPageChange = jest.fn()
    await render(<Photos onPageChange={onPageChange} />)
    await layOut()
    await fireEvent.press(screen.getByLabelText("Next slide"))
    expect(onPageChange).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ reason: "next-press" })
    )
    expect(screen.getByLabelText("Forest").props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    )
  })

  describe("with fake timers", () => {
    beforeEach(() => jest.useFakeTimers({ doNotFake: ["queueMicrotask"] }))
    afterEach(() => jest.useRealTimers())

    test("the content moves to the page", async () => {
      await render(<Photos />)
      await layOut()
      expect(translateX()).toBe(0)
      await fireEvent.press(screen.getByLabelText("Next slide"))
      await settle()
      expect(translateX()).toBe(-300)
    })

    test("a drag follows the finger and lets go on the next page", async () => {
      const onPageChange = jest.fn()
      await render(<Photos onPageChange={onPageChange} />)
      await layOut()
      const viewport = await drag(250, 230, 200, 150)
      expect(translateX()).toBeLessThan(-50)
      expect(screen.getByTestId("viewport").props.style).toBeDefined()
      await fireEvent(viewport, "responderRelease", at(150))
      expect(onPageChange).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ reason: "swipe" })
      )
      await settle()
      expect(translateX()).toBe(-300)
    })

    test("a drag survives the app re-rendering on its grant", async () => {
      const onPageChange = jest.fn()
      function Held() {
        const [held, setHeld] = React.useState(false)
        return (
          <Carousel aria-label="Photos" onPageChange={onPageChange}>
            <CarouselViewport
              testID="viewport"
              accessibilityHint={held ? "held" : undefined}
              onResponderGrant={() => setHeld(true)}
              onResponderRelease={() => setHeld(false)}
            >
              <CarouselContent testID="content">
                {slides.map((name) => (
                  <CarouselItem key={name} testID={name}>
                    <Text>{name}</Text>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </CarouselViewport>
          </Carousel>
        )
      }
      await render(<Held />)
      await layOut()
      const viewport = await drag(250, 230, 200, 150)
      await fireEvent(viewport, "responderRelease", at(150))
      expect(onPageChange).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ reason: "swipe" })
      )
    })

    test("a drag a scroll view takes goes back to its page", async () => {
      const onPageChange = jest.fn()
      await render(<Photos onPageChange={onPageChange} />)
      await layOut()
      const viewport = await drag(280, 200, 100)
      await fireEvent(viewport, "responderTerminate", at(100))
      await settle()
      expect(onPageChange).not.toHaveBeenCalled()
      expect(translateX()).toBe(0)
    })

    test("rotation pages on its own", async () => {
      const onPageChange = jest.fn()
      await render(
        <Photos defaultPlaying interval={1000} onPageChange={onPageChange} />
      )
      await layOut()
      await act(async () => jest.advanceTimersByTime(1100))
      expect(onPageChange).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ reason: "timeout" })
      )
    })
  })

  test("the viewport takes touches unless drag is off", async () => {
    const { rerender } = await render(<Photos />)
    await layOut()
    const viewport = () => screen.getByTestId("viewport")
    expect(viewport().props.onStartShouldSetResponder()).toBe(true)
    await rerender(<Photos drag={false} />)
    expect(viewport().props.onStartShouldSetResponder()).toBe(false)
  })

  test("slides are labelled by place and hidden while out of view", async () => {
    await render(<Photos />)
    await layOut()
    const lake = screen.getByTestId("Lake", hidden)
    const forest = screen.getByTestId("Forest", hidden)
    expect(lake.props.accessibilityLabel).toBe("1 of 3")
    expect(forest.props.accessibilityLabel).toBe("2 of 3")
    expect(lake.props.accessibilityElementsHidden).toBeFalsy()
    expect(
      forest.props.importantForAccessibility ??
        forest.props.accessibilityElementsHidden
    ).toBeTruthy()
  })

  test("on iOS, a slide coming into view is announced unless it rotates", async () => {
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] })
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
      .mockImplementation(() => {})
    await render(<Photos />)
    await layOut()
    await settle()
    expect(announce).not.toHaveBeenCalledWith("1 of 3, Lake", expect.anything())
    announce.mockClear()
    await fireEvent.press(screen.getByLabelText("Desert"))
    await settle()
    await settle()
    expect(announce.mock.calls).toEqual(
      os === "ios" ? [["3 of 3, Desert", { queue: true }]] : []
    )
    announce.mockRestore()
    jest.useRealTimers()
  })

  test("a slide's label follows a reorder", async () => {
    const { rerender } = await render(<Photos />)
    await layOut()
    slides.reverse()
    await rerender(<Photos />)
    await layOut()
    slides.reverse()
    expect(screen.getByTestId("Desert", hidden).props.accessibilityLabel).toBe(
      "1 of 3"
    )
  })

  test("an indicator goes to its page and is selected there", async () => {
    const onPageChange = jest.fn()
    await render(<Photos onPageChange={onPageChange} />)
    await layOut()
    await fireEvent.press(screen.getByLabelText("Desert"))
    expect(onPageChange).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ reason: "item-press" })
    )
    expect(screen.getByLabelText("Desert").props.accessibilityRole).toBe("tab")
    expect(screen.getByLabelText("Desert").props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    )
    expect(screen.getByLabelText("Lake").props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false })
    )
  })

  test("Previous reads as disabled on the first page", async () => {
    await render(<Photos />)
    await layOut()
    expect(
      screen.getByLabelText("Previous slide").props.accessibilityState
    ).toEqual(expect.objectContaining({ disabled: true }))
    expect(
      screen.getByLabelText("Next slide").props.accessibilityState?.disabled
    ).toBeFalsy()
  })

  test("with loop, Next on the last page goes back to the first", async () => {
    const onPageChange = jest.fn()
    await render(<Photos loop defaultPage={3} onPageChange={onPageChange} />)
    await layOut()
    await fireEvent.press(screen.getByLabelText("Next slide"))
    expect(onPageChange).toHaveBeenCalledWith(1, expect.anything())
  })

  describe("checks", () => {
    test("passes the carousel pattern once each spring settles", async () => {
      jest.useFakeTimers({ doNotFake: ["queueMicrotask"] })
      await render(<Photos />)
      await layOut()
      const settled = async (action: () => unknown) => {
        await act(async () => {
          await action()
        })
        await settle()
      }
      await expect(
        checkPattern(screen.container, "carousel", { os, act: settled })
      ).resolves.toBeUndefined()
      jest.useRealTimers()
    })

    test("passes in both directions once each spring settles", async () => {
      jest.useFakeTimers({ doNotFake: ["queueMicrotask"] })
      const settled = async (action: () => unknown) => {
        await act(async () => {
          await action()
        })
        await settle()
      }
      await expect(
        checkDirection(
          async () => {
            await render(<Photos />)
            await layOut()
            return screen.container
          },
          { os, act: settled }
        )
      ).resolves.toBeUndefined()
      jest.useRealTimers()
    })

    test("is created and destroyed with no host api", () => {
      expect(() =>
        checkCreation(carousel, { defaultPage: 2, loop: true })
      ).not.toThrow()
    })

    test("the pattern fails on an indicator that shows nothing new", async () => {
      await render(
        <View>
          <Text>Lake</Text>
          <View accessibilityRole={os === "ios" ? "tabbar" : "tablist"}>
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="One"
              accessibilityState={{ selected: true }}
            />
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Two"
              accessibilityState={{ selected: false }}
            />
          </View>
        </View>
      )
      await expect(
        checkPattern(screen.container, "carousel", { os, act })
      ).rejects.toThrow("an indicator shows its page")
    })

    test("the pattern fails on an unnamed button", async () => {
      await render(
        <View>
          <Text>Lake</Text>
          <Pressable accessibilityRole="button" />
        </View>
      )
      await expect(
        checkPattern(screen.container, "carousel", { os, act })
      ).rejects.toThrow("button")
    })
  })
})
