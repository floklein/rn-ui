import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Platform, Text, View } from "react-native"
import { checkPattern } from "../src/check-pattern"
import {
  createImageCropperController,
  ImageCropper,
  ImageCropperGrid,
  ImageCropperHandle,
  ImageCropperImage,
  type ImageCropperOptions,
  ImageCropperSelection,
  ImageCropperRotate,
  ImageCropperViewport,
  ImageCropperZoom,
} from "../src/image-cropper"

// Jest's views don't lay out: every view's box starts at 0, 0.
beforeAll(() => {
  Object.assign(View.prototype, {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 320, height: 210 }),
  })
})

afterEach(() => jest.restoreAllMocks())

const photo = "https://example.com/photo.png"
const hidden = { includeHiddenElements: true }

function Cropper(props: ImageCropperOptions) {
  return (
    <ImageCropper aria-label="Photo" src={photo} {...props}>
      <ImageCropperViewport testID="viewport">
        <ImageCropperImage testID="image" alt="Mountains" />
        <ImageCropperSelection testID="selection">
          <ImageCropperGrid />
          <ImageCropperHandle testID="se" position="se" />
          <ImageCropperHandle testID="n" position="n" />
        </ImageCropperSelection>
      </ImageCropperViewport>
      <ImageCropperZoom testID="zoom" />
      <ImageCropperRotate testID="rotate">
        <Text>Rotate</Text>
      </ImageCropperRotate>
    </ImageCropper>
  )
}

// A 640 by 420 image in a 320 by 210 viewport shows at half its size.
async function loaded(width = 640, height = 420) {
  await fireEvent(screen.getByTestId("image", hidden), "load", {
    nativeEvent: { source: { width, height } },
  })
  await fireEvent(
    screen.getByTestId("viewport").children[0] as never,
    "layout",
    {
      nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 210 } },
    }
  )
}

const at = (x: number, y: number) => ({
  nativeEvent: {
    pageX: x,
    pageY: y,
    identifier: 1,
    touches: [{ pageX: x, pageY: y, identifier: 1 }],
  },
})

const flat = (style: unknown) =>
  Object.assign({}, ...[style].flat(Infinity).filter(Boolean))

const fingers = (...points: [number, number][]) => ({
  nativeEvent: {
    pageX: points[0][0],
    pageY: points[0][1],
    identifier: 1,
    touches: points.map(([pageX, pageY], index) => ({
      pageX,
      pageY,
      identifier: index + 1,
    })),
  },
})

const adjust = (testID: string, actionName: "increment" | "decrement") =>
  fireEvent(screen.getByTestId(testID), "accessibilityAction", {
    nativeEvent: { actionName },
  })

async function drag(testID: string, ...points: [number, number][]) {
  const view = screen.getByTestId(testID)
  const [first, ...rest] = points
  expect(view.props.onStartShouldSetResponder(at(...first))).toBe(true)
  await fireEvent(view, "responderGrant", at(...first))
  for (const point of rest) {
    await fireEvent(view, "responderMove", at(...point))
  }
  return view
}

describe("ImageCropper", () => {
  test("a touch drag on the selection moves the crop and commits once when it lifts", async () => {
    const onCropChange = jest.fn()
    const onCropCommit = jest.fn()
    await render(
      <Cropper onCropChange={onCropChange} onCropCommit={onCropCommit} />
    )
    await loaded()
    expect(onCropCommit).toHaveBeenCalledWith(
      {
        x: 64,
        y: 42,
        width: 512,
        height: 336,
        rotation: 0,
        flipX: false,
        flipY: false,
      },
      expect.objectContaining({ reason: "image-load" })
    )
    onCropCommit.mockClear()
    const selection = await drag("selection", [100, 100], [110, 120])
    expect(onCropChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: 84, y: 82, width: 512, height: 336 }),
      expect.objectContaining({ reason: "drag", source: "touch" })
    )
    expect(onCropCommit).not.toHaveBeenCalled()
    await fireEvent(selection, "responderRelease", at(110, 120))
    expect(onCropCommit).toHaveBeenCalledTimes(1)
    expect(onCropCommit).toHaveBeenCalledWith(
      expect.objectContaining({ x: 84, y: 82 }),
      expect.objectContaining({ reason: "drag" })
    )
  })

  test("a cancelled responder puts the crop back and commits nothing", async () => {
    const onCropCommit = jest.fn()
    await render(<Cropper onCropCommit={onCropCommit} />)
    await loaded()
    onCropCommit.mockClear()
    const selection = await drag("selection", [100, 100], [110, 120])
    await fireEvent(selection, "responderTerminate", at(110, 120))
    expect(screen.getByTestId("selection").props.accessibilityValue.text).toBe(
      "512 by 336 pixels, at 64, 42"
    )
    expect(onCropCommit).not.toHaveBeenCalled()
  })

  test("a touch that lifts without moving changes nothing", async () => {
    const onCropChange = jest.fn()
    await render(<Cropper onCropChange={onCropChange} />)
    await loaded()
    onCropChange.mockClear()
    const selection = await drag("selection", [100, 100])
    await fireEvent(selection, "responderRelease", at(100, 100))
    expect(onCropChange).not.toHaveBeenCalled()
    expect(screen.getByTestId("selection").props.accessibilityState).toEqual(
      expect.not.objectContaining({ busy: true })
    )
  })

  test("a handle's drag resizes the crop from its edge or corner", async () => {
    const onCropCommit = jest.fn()
    await render(<Cropper onCropCommit={onCropCommit} />)
    await loaded()
    const corner = await drag("se", [0, 0], [-10, -20])
    await fireEvent(corner, "responderRelease", at(-10, -20))
    expect(onCropCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: 64, y: 42, width: 492, height: 296 }),
      expect.objectContaining({ reason: "drag" })
    )
  })

  test("the selection and the image are placed over the viewport", async () => {
    await render(<Cropper />)
    await loaded()
    expect(flat(screen.getByTestId("selection").props.style)).toMatchObject({
      position: "absolute",
      left: 32,
      top: 21,
      width: 256,
      height: 168,
    })
    expect(flat(screen.getByTestId("image").props.style)).toMatchObject({
      position: "absolute",
      left: 0,
      top: 0,
      width: 320,
      height: 210,
    })
  })

  test("a turned and flipped image keeps its own box, turned about its middle", async () => {
    const seen: unknown[] = []
    await render(
      <ImageCropper
        src={photo}
        defaultCrop={{
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 90,
          flipX: true,
        }}
        style={(state) => void seen.push(state.imageAspectRatio)}
      >
        <ImageCropperViewport testID="viewport">
          <ImageCropperImage testID="image" />
        </ImageCropperViewport>
      </ImageCropper>
    )
    await loaded()
    const style = flat(screen.getByTestId("image").props.style)
    expect(style.width).toBeCloseTo(210)
    expect(style.height).toBeCloseTo(137.81)
    expect(style.left).toBeCloseTo(55)
    expect(style.top).toBeCloseTo(36.09)
    expect(style.transform).toEqual([
      { scaleX: -1 },
      { scaleY: 1 },
      { rotate: "90deg" },
    ])
    expect(seen.at(-1)).toBeCloseTo(420 / 640)
  })

  test("in a frame one finger pans the image and two pinch it, committing once", async () => {
    const onCropChange = jest.fn()
    const onCropCommit = jest.fn()
    await render(
      <Cropper
        mode="frame"
        aspectRatio={1}
        onCropChange={onCropChange}
        onCropCommit={onCropCommit}
      />
    )
    await loaded()
    onCropCommit.mockClear()
    expect(
      screen
        .getByTestId("selection")
        .props.onStartShouldSetResponder(at(100, 100))
    ).toBe(false)
    const viewport = screen.getByTestId("viewport")
    expect(viewport.props.onStartShouldSetResponder(at(110, 105))).toBe(true)
    await fireEvent(viewport, "responderGrant", fingers([110, 105]))
    await fireEvent(viewport, "responderMove", fingers([100, 105]))
    expect(onCropChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: 130, y: 0, width: 420 }),
      expect.objectContaining({ reason: "drag", source: "touch" })
    )
    await fireEvent(viewport, "responderStart", fingers([100, 105], [200, 105]))
    await fireEvent(viewport, "responderMove", fingers([50, 105], [250, 105]))
    expect(onCropChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ width: 210, height: 210 }),
      expect.objectContaining({ reason: "pinch", source: "touch" })
    )
    await fireEvent(viewport, "responderEnd", fingers([250, 105]))
    await fireEvent(viewport, "responderRelease", fingers([250, 105]))
    expect(onCropCommit).toHaveBeenCalledTimes(1)
    expect(onCropCommit).toHaveBeenCalledWith(
      expect.objectContaining({ width: 210 }),
      expect.objectContaining({ reason: "pinch" })
    )
  })

  test("increment and decrement move the selection, grow a handle's edge and step the zoom", async () => {
    const onCropCommit = jest.fn()
    await render(<Cropper onCropCommit={onCropCommit} />)
    await loaded()
    expect(screen.getByTestId("selection").props.accessibilityRole).toBe(
      "adjustable"
    )
    await adjust("selection", "decrement")
    expect(onCropCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: 44, y: 42 }),
      expect.objectContaining({ reason: "step-key", source: "virtual" })
    )
    await adjust("n", "increment")
    expect(onCropCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({ y: 22, height: 356 }),
      expect.objectContaining({ reason: "step-key" })
    )
    expect(screen.getByTestId("n").props.accessibilityValue).toMatchObject({
      now: 356,
    })
    await adjust("zoom", "increment")
    expect(screen.getByTestId("zoom").props.accessibilityValue).toMatchObject({
      min: 1,
      max: 10,
    })
    expect(onCropCommit).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ reason: "zoom-input" })
    )
  })

  test("a touch on the zoom track zooms there and a drag follows it", async () => {
    const onCropCommit = jest.fn()
    await render(<Cropper maxZoom={3} onCropCommit={onCropCommit} />)
    await loaded()
    const zoom = await drag("zoom", [160, 5])
    await fireEvent(zoom, "responderRelease", at(160, 5))
    expect(onCropCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({ width: 320, height: 210 }),
      expect.objectContaining({ reason: "zoom-input" })
    )
    expect(screen.getByTestId("zoom").props.accessibilityValue).toMatchObject({
      now: 2,
      text: "200%",
    })
  })

  test("the zoom's state says where its thumb sits along the track", async () => {
    const seen: number[] = []
    const controller = createImageCropperController()
    await render(
      <ImageCropper src={photo} maxZoom={3} controller={controller}>
        <ImageCropperViewport testID="viewport">
          <ImageCropperImage testID="image" />
        </ImageCropperViewport>
        <ImageCropperZoom
          style={(state) => void seen.push(state.zoomPosition)}
        />
      </ImageCropper>
    )
    await loaded()
    await act(() => controller.setZoom(2))
    expect(seen.at(-1)).toBeCloseTo(50)
  })

  test("the rotate button turns the image a quarter", async () => {
    const onCropCommit = jest.fn()
    await render(<Cropper onCropCommit={onCropCommit} />)
    await loaded()
    await fireEvent.press(screen.getByTestId("rotate"))
    expect(onCropCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({ rotation: 90 }),
      expect.objectContaining({ reason: "rotate-press" })
    )
  })

  test("a disabled cropper takes no touch", async () => {
    await render(<Cropper disabled />)
    await loaded()
    expect(
      screen.getByTestId("selection").props.onStartShouldSetResponder(at(1, 1))
    ).toBe(false)
  })

  test("a controller's focus() asks for the selection", async () => {
    const controller = createImageCropperController()
    const sent = jest.spyOn(
      require("react-native").AccessibilityInfo,
      "sendAccessibilityEvent"
    )
    await render(<Cropper controller={controller} />)
    await loaded()
    await act(() => controller.focus())
    expect(sent).toHaveBeenCalledWith(expect.anything(), "focus")
  })

  test("passes the slider pattern", async () => {
    await render(<Cropper />)
    await loaded()
    await expect(
      checkPattern(screen.container, "slider", {
        os: Platform.OS === "android" ? "android" : "ios",
        act,
      })
    ).resolves.toBeUndefined()
  })
})
