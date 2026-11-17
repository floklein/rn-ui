import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { AccessibilityInfo, Text } from "react-native"
import { Field, FieldLabel } from "../src/field"
import {
  createFileInputController,
  FileInput,
  FileInputItem,
  FileInputItemRemove,
  FileInputList,
  FileInputTrigger,
  type PickedFile,
} from "../src/file-input"

const photo: PickedFile = {
  name: "photo.png",
  size: 2_000,
  type: "image/png",
  uri: "file:///photo.png",
}
const notes: PickedFile = {
  name: "notes.txt",
  size: 300,
  type: "text/plain",
  uri: "file:///notes.txt",
}
const scan: PickedFile = {
  name: "scan.PDF",
  size: 9_000_000,
  type: "",
  uri: "file:///scan.pdf",
}

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)
afterEach(() => sendAccessibilityEvent.mockClear())

const views: Record<string, unknown> = {}

function Files(props: React.ComponentProps<typeof FileInput>) {
  return (
    <FileInput {...props}>
      <FileInputTrigger
        testID="trigger"
        ref={(view: unknown) => {
          views.trigger = view
        }}
      >
        <Text>Choose files</Text>
      </FileInputTrigger>
      <FileInputList testID="list">
        <FileInputItem>
          {({ file }) => (
            <>
              <Text>{file.name}</Text>
              <FileInputItemRemove
                ref={(view: unknown) => {
                  views[file.name] = view
                }}
              />
            </>
          )}
        </FileInputItem>
      </FileInputList>
    </FileInput>
  )
}

describe("FileInput", () => {
  test("the trigger calls pick with the rules, and core's checks sort what it returns", async () => {
    const pick = jest.fn(async () => [photo, notes, scan])
    const onValueChange = jest.fn()
    const onReject = jest.fn()
    await render(
      <Files
        pick={pick}
        multiple
        accept={["image/*", ".pdf"]}
        maxSize={5_000_000}
        onValueChange={onValueChange}
        onReject={onReject}
      />
    )
    await fireEvent.press(screen.getByTestId("trigger"))
    expect(pick).toHaveBeenCalledWith({
      accept: ["image/*", ".pdf"],
      multiple: true,
    })
    await act(async () => {})

    expect(screen.getByText("photo.png")).toBeOnTheScreen()
    expect(screen.queryByText("notes.txt")).toBeNull()
    const [value, details] = onValueChange.mock.lastCall
    expect(value).toEqual([photo])
    expect(details).toMatchObject({ reason: "picker", added: [photo] })
    expect(onReject.mock.lastCall[0]).toEqual([
      { file: notes, reasons: ["file-type"] },
      { file: scan, reasons: ["file-too-large"] },
    ])
  })

  test("without multiple, a picked file replaces the one it holds, and a canceled pick changes nothing", async () => {
    const pick = jest.fn()
    const onValueChange = jest.fn()
    await render(
      <Files pick={pick} defaultValue={[notes]} onValueChange={onValueChange} />
    )
    pick.mockResolvedValueOnce(null)
    await fireEvent.press(screen.getByTestId("trigger"))
    await act(async () => {})
    expect(pick).toHaveBeenCalledWith({ accept: [], multiple: false })
    expect(onValueChange).not.toHaveBeenCalled()

    pick.mockReturnValueOnce([photo, scan])
    await fireEvent.press(screen.getByTestId("trigger"))
    await act(async () => {})
    expect(screen.getByText("photo.png")).toBeOnTheScreen()
    expect(screen.queryByText("notes.txt")).toBeNull()
    expect(onValueChange.mock.lastCall[1]).toMatchObject({
      added: [photo],
      removed: [notes],
      rejected: [{ file: scan, reasons: ["too-many-files"] }],
    })
  })

  test("a remove button is named for its file, removes it and moves focus to the next file's, else the trigger", async () => {
    const onValueChange = jest.fn()
    await render(
      <Files
        multiple
        defaultValue={[photo, notes]}
        onValueChange={onValueChange}
      />
    )
    await fireEvent.press(
      screen.getByRole("button", { name: "Remove photo.png" })
    )
    await act(async () => {})
    expect(screen.queryByText("photo.png")).toBeNull()
    expect(onValueChange.mock.lastCall[1]).toMatchObject({
      reason: "remove-press",
      removed: [photo],
    })
    expect(
      sendAccessibilityEvent.mock.lastCall?.[0] === views["notes.txt"]
    ).toBe(true)

    await fireEvent.press(
      screen.getByRole("button", { name: "Remove notes.txt" })
    )
    await act(async () => {})
    expect(sendAccessibilityEvent.mock.lastCall?.[0] === views.trigger).toBe(
      true
    )
  })

  test("a disabled file input, or one in a disabled Field, never calls pick", async () => {
    const pick = jest.fn()
    await render(<Files pick={pick} disabled defaultValue={[photo]} />)
    expect(screen.getByTestId("trigger")).toBeDisabled()
    expect(
      screen.getByRole("button", { name: "Remove photo.png" })
    ).toBeDisabled()
    await fireEvent.press(screen.getByTestId("trigger"))
    expect(pick).not.toHaveBeenCalled()

    await render(
      <Field disabled>
        <Files pick={pick} />
      </Field>
    )
    expect(screen.getByTestId("trigger")).toBeDisabled()
    await fireEvent.press(screen.getByTestId("trigger"))
    expect(pick).not.toHaveBeenCalled()
  })

  test("a Field's label names the trigger with its own text, and pressing the label calls pick", async () => {
    const pick = jest.fn()
    await render(
      <Field>
        <FieldLabel>Attachments</FieldLabel>
        <Files pick={pick} />
      </Field>
    )
    expect(screen.getByTestId("trigger").props.accessibilityLabel).toBe(
      "Attachments Choose files"
    )
    await fireEvent.press(screen.getByText("Attachments"))
    expect(pick).toHaveBeenCalledTimes(1)
  })

  test("a controller calls pick, checks the files it adds, and focuses the trigger", async () => {
    const controller = createFileInputController()
    const pick = jest.fn(() => [photo])
    await render(
      <Files controller={controller} pick={pick} accept="image/*" multiple />
    )
    await act(async () => {
      expect(controller.open()).toBe(true)
    })
    expect(controller.getValue()).toEqual([photo])
    await act(async () => {
      expect(controller.addFiles([notes])).toBe(false)
    })
    expect(controller.getValue()).toEqual([photo])
    await act(() => controller.focus())
    expect(sendAccessibilityEvent.mock.lastCall?.[0] === views.trigger).toBe(
      true
    )
  })

  test("a trigger outside the file input opens it through its controller", async () => {
    const controller = createFileInputController()
    const pick = jest.fn(() => [photo])
    await render(
      <>
        <FileInputTrigger controller={controller} testID="outside">
          <Text>Attach</Text>
        </FileInputTrigger>
        <Files controller={controller} pick={pick} />
      </>
    )
    await act(async () => {})
    await fireEvent.press(screen.getByTestId("outside"))
    await act(async () => {})
    expect(screen.getByText("photo.png")).toBeOnTheScreen()
  })

  test("a trigger with no pick warns that it opens nothing", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
    await render(<Files />)
    await fireEvent.press(screen.getByTestId("trigger"))
    expect(warn.mock.lastCall?.[0]).toMatch(/has no `pick`/)
    warn.mockRestore()
  })
})
