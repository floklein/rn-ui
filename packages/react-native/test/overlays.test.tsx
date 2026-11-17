import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Modal, Text } from "react-native"
import { confirm, createConfirm } from "../src/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../src/dialog"
import { createOverlays, OverlayHost } from "../src/overlays"

type Node = { type: unknown; parent: Node | null }

function modals(node: Node) {
  let count = 0
  for (let at = node.parent; at; at = at.parent) {
    count += at.type === "Modal" ? 1 : 0
  }
  return count
}

const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
afterEach(() => warn.mockClear())
// Core checks for a host a second after each question.
beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

describe("confirm()", () => {
  test("OverlayHost shows the question and the promise resolves with the answer", async () => {
    await render(
      <OverlayHost>
        <Text>App</Text>
      </OverlayHost>
    )
    let answer: Promise<boolean> | undefined
    await act(async () => {
      answer = confirm({
        title: "Archive this project?",
        description: "You can restore it anytime.",
        confirmLabel: "Archive",
      })
    })
    expect(screen.getByRole("header")).toHaveTextContent(
      "Archive this project?"
    )
    expect(screen.getByText("You can restore it anytime.")).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole("button", { name: "Archive" }))
    await expect(answer).resolves.toBe(true)
    expect(screen.queryByRole("header")).toBeNull()
    expect(warn).not.toHaveBeenCalled()
  })

  test("asked while a modal dialog is open, it renders inside that dialog's Modal", async () => {
    await render(
      <OverlayHost>
        <Dialog>
          <DialogTrigger>
            <Text>Edit project</Text>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Edit project</DialogTitle>
          </DialogContent>
        </Dialog>
      </OverlayHost>
    )
    await fireEvent.press(screen.getByRole("button", { name: "Edit project" }))
    let answer: Promise<boolean> | undefined
    await act(async () => {
      answer = confirm({ title: "Discard changes?" })
    })
    const title = screen.getByText("Discard changes?")
    expect(modals(title as unknown as Node)).toBe(2)
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }))
    await expect(answer).resolves.toBe(false)
    expect(
      screen.getByRole("header", { name: "Edit project" })
    ).toBeOnTheScreen()
  })

  test("asked while the app's own Modal with an OverlayHost is open, it renders inside that Modal", async () => {
    const app = (sheet: boolean) => (
      <OverlayHost>
        <Modal visible={sheet}>
          <OverlayHost>
            <Text>Sheet</Text>
          </OverlayHost>
        </Modal>
      </OverlayHost>
    )
    const { rerender } = await render(app(false))
    await rerender(app(true))
    await act(async () => {
      confirm({ title: "Archive this project?" })
    })
    const title = screen.getByRole("header")
    expect(modals(title as unknown as Node)).toBe(2)
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }))
  })

  test("with no OverlayHost, development builds warn that nothing renders it", async () => {
    const ask = createConfirm({ overlays: createOverlays() })
    await render(<Text>App</Text>)
    await act(async () => {
      ask({ title: "Archive this project?" })
    })
    await act(() => jest.advanceTimersByTime(1000))
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.lastCall?.join(" ")).toMatch(/OverlayHost/)
  })
})
