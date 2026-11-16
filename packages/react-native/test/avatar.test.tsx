import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Text } from "react-native"
import { Avatar, AvatarFallback, AvatarImage } from "../src/avatar"

const hidden = { includeHiddenElements: true }
const source = { uri: "https://example.com/ada.png" }

function Person({
  onLoadingStatusChange,
  image = source,
  delay,
}: {
  onLoadingStatusChange?: () => void
  image?: { uri: string } | null
  delay?: number
}) {
  return (
    <Avatar onLoadingStatusChange={onLoadingStatusChange} testID="avatar">
      <AvatarImage
        source={image ?? undefined}
        alt="Ada Lovelace"
        testID="image"
      />
      <AvatarFallback delay={delay} testID="fallback">
        <Text>AL</Text>
      </AvatarFallback>
    </Avatar>
  )
}

describe("Avatar", () => {
  test("shows the fallback while the image loads, then the image, named by its alt", async () => {
    const onLoadingStatusChange = jest.fn()
    await render(<Person onLoadingStatusChange={onLoadingStatusChange} />)
    expect(screen.getByText("AL")).toBeOnTheScreen()
    expect(screen.queryByLabelText("Ada Lovelace")).toBeNull()
    expect(onLoadingStatusChange).toHaveBeenLastCalledWith(
      "loading",
      expect.objectContaining({ reason: "src-change" })
    )

    await fireEvent(screen.getByTestId("image", hidden), "load")
    expect(screen.queryByText("AL")).toBeNull()
    expect(screen.getByLabelText("Ada Lovelace")).toBeOnTheScreen()
    const [status, details] = onLoadingStatusChange.mock.lastCall
    expect(status).toBe("loaded")
    expect(details).toMatchObject({ reason: "image-load" })
    expect(details.event).toBeUndefined()
  })

  test("keeps the fallback when the image fails", async () => {
    const onLoadingStatusChange = jest.fn()
    await render(<Person onLoadingStatusChange={onLoadingStatusChange} />)
    await fireEvent(screen.getByTestId("image", hidden), "error")
    expect(screen.getByText("AL")).toBeOnTheScreen()
    expect(screen.queryByLabelText("Ada Lovelace")).toBeNull()
    expect(onLoadingStatusChange).toHaveBeenLastCalledWith(
      "error",
      expect.objectContaining({ reason: "image-error" })
    )
  })

  test("an image with no source fails at once", async () => {
    const onLoadingStatusChange = jest.fn()
    await render(
      <Person image={null} onLoadingStatusChange={onLoadingStatusChange} />
    )
    expect(onLoadingStatusChange).toHaveBeenCalledTimes(1)
    expect(onLoadingStatusChange).toHaveBeenLastCalledWith(
      "error",
      expect.objectContaining({ reason: "image-error" })
    )
  })

  test("the image stays out of sight until it loads", async () => {
    await render(<Person />)
    const image = screen.getByTestId("image", hidden)
    expect(image).toHaveStyle({ position: "absolute", opacity: 0 })
    await fireEvent(image, "load")
    expect(screen.getByTestId("image", hidden)).not.toHaveStyle({ opacity: 0 })
  })

  test("a new source keeps the loaded image showing while it loads", async () => {
    const { rerender } = await render(<Person />)
    await fireEvent(screen.getByTestId("image", hidden), "load")
    await rerender(<Person image={{ uri: "https://example.com/hedy.png" }} />)
    expect(screen.queryByText("AL")).toBeNull()
    expect(screen.getByLabelText("Ada Lovelace")).toBeOnTheScreen()
  })

  test("the status goes back to idle when the image leaves", async () => {
    const onLoadingStatusChange = jest.fn()
    const { rerender } = await render(
      <Person onLoadingStatusChange={onLoadingStatusChange} />
    )
    await fireEvent(screen.getByTestId("image", hidden), "load")
    await rerender(
      <Avatar onLoadingStatusChange={onLoadingStatusChange}>
        <AvatarFallback>
          <Text>AL</Text>
        </AvatarFallback>
      </Avatar>
    )
    await act(() => Promise.resolve())
    expect(onLoadingStatusChange).toHaveBeenLastCalledWith(
      "idle",
      expect.objectContaining({ reason: "src-change" })
    )
    expect(screen.getByText("AL")).toBeOnTheScreen()
  })

  test("a fallback with a delay shows only once it has passed", async () => {
    jest.useFakeTimers()
    try {
      await render(<Person delay={600} />)
      expect(screen.queryByText("AL")).toBeNull()
      await act(() => jest.advanceTimersByTime(600))
      expect(screen.getByText("AL")).toBeOnTheScreen()
    } finally {
      jest.useRealTimers()
    }
  })

  test("style functions get the loading status", async () => {
    await render(
      <Avatar
        testID="avatar"
        style={({ loadingStatus }) => ({
          opacity: loadingStatus === "loaded" ? 1 : 0.5,
        })}
      >
        <AvatarImage source={source} alt="Ada Lovelace" testID="image" />
      </Avatar>
    )
    expect(screen.getByTestId("avatar")).toHaveStyle({ opacity: 0.5 })
    await fireEvent(screen.getByTestId("image", hidden), "load")
    expect(screen.getByTestId("avatar")).toHaveStyle({ opacity: 1 })
  })
})
