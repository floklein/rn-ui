import { fireEvent, render, screen } from "@testing-library/react-native"
import { Platform, Text } from "react-native"
import { Avatar, AvatarFallback, AvatarImage } from "../src/avatar"

// The preset's mock skips what `Image` does with `alt`, which makes it accessible.
jest.unmock("react-native/Libraries/Image/Image")

const hidden = { includeHiddenElements: true }
const source = { uri: "https://example.com/ada.png" }

const image = () => screen.getByTestId("image", hidden)

describe("AvatarImage, as React Native's Image renders it", () => {
  test("isn't an accessible element until it loads", async () => {
    await render(
      <Avatar>
        <AvatarImage source={source} alt="Ada Lovelace" testID="image" />
        <AvatarFallback>
          <Text>AL</Text>
        </AvatarFallback>
      </Avatar>
    )
    expect(image().props.accessible).toBe(false)
  })

  test("once loaded, is named by its alt, and is no Tab stop on Android", async () => {
    await render(
      <Avatar>
        <AvatarImage source={source} alt="Ada Lovelace" testID="image" />
      </Avatar>
    )
    await fireEvent(image(), "load")
    expect(image().props.accessibilityLabel).toBe("Ada Lovelace")
    expect(image().props.accessible).toBe(Platform.OS === "ios")
  })

  test("an empty alt makes it decorative, out of the screen reader's reach", async () => {
    await render(
      <Avatar>
        <AvatarImage source={source} alt="" testID="image" />
      </Avatar>
    )
    await fireEvent(image(), "load")
    expect(image().props.accessible).toBe(false)
    expect(image().props.accessibilityLabel).toBeUndefined()
  })

  test("an image given only srcSet starts loading, not failing", async () => {
    const onLoadingStatusChange = jest.fn()
    await render(
      <Avatar onLoadingStatusChange={onLoadingStatusChange}>
        <AvatarImage
          srcSet="https://example.com/ada.png 1x"
          alt="Ada Lovelace"
          testID="image"
        />
      </Avatar>
    )
    expect(onLoadingStatusChange.mock.calls.map(([status]) => status)).toEqual([
      "loading",
    ])
  })
})
