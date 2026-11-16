import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Text } from "react-native"
import type { TestInstance } from "test-renderer"
import {
  createPaginationController,
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "../src/pagination"

function Pages(props: React.ComponentProps<typeof Pagination>) {
  return (
    <Pagination aria-label="Pagination" {...props}>
      <PaginationList>
        {({ items }) => (
          <>
            <PaginationItem>
              <PaginationPrevious aria-label="Previous" testID="previous" />
            </PaginationItem>
            {items.map((item) => (
              <PaginationItem key={item}>
                {typeof item === "number" ? (
                  <PaginationLink page={item} />
                ) : (
                  <PaginationEllipsis testID={item} />
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext aria-label="Next" testID="next" />
            </PaginationItem>
          </>
        )}
      </PaginationList>
    </Pagination>
  )
}

function hostProps(node: TestInstance = screen.container) {
  const found: Record<string, unknown>[] = []
  for (const child of node.children) {
    if (typeof child !== "string") {
      found.push(child.props, ...hostProps(child))
    }
  }
  return found
}

const page = (name: string) => screen.getByRole("button", { name })

describe("Pagination", () => {
  test("a press on a page goes there, with the item-press reason and a touch source", async () => {
    const onPageChange = jest.fn()
    await render(<Pages pageCount={10} onPageChange={onPageChange} />)
    await fireEvent.press(page("2"))
    expect(onPageChange).toHaveBeenCalledTimes(1)
    const [to, details] = onPageChange.mock.lastCall
    expect(to).toBe(2)
    expect(details).toMatchObject({ reason: "item-press", source: "touch" })
    expect(details.event).toBeUndefined()
  })

  test("the current page is selected, and only it", async () => {
    await render(<Pages pageCount={10} defaultPage={3} />)
    expect(page("3")).toBeSelected()
    expect(page("2")).not.toBeSelected()
    await fireEvent.press(page("4"))
    expect(page("4")).toBeSelected()
    expect(page("3")).not.toBeSelected()
  })

  test("Next and Previous step one page, with their reasons", async () => {
    const onPageChange = jest.fn()
    await render(
      <Pages pageCount={10} defaultPage={5} onPageChange={onPageChange} />
    )
    await fireEvent.press(screen.getByTestId("next"))
    expect(onPageChange.mock.lastCall[0]).toBe(6)
    expect(onPageChange.mock.lastCall[1].reason).toBe("next-press")
    await fireEvent.press(screen.getByTestId("previous"))
    await fireEvent.press(screen.getByTestId("previous"))
    expect(onPageChange.mock.lastCall[0]).toBe(4)
    expect(onPageChange.mock.lastCall[1].reason).toBe("previous-press")
  })

  test("First and Last go to the ends, and are disabled there", async () => {
    const onPageChange = jest.fn()
    await render(
      <Pagination pageCount={4} defaultPage={2} onPageChange={onPageChange}>
        <PaginationFirst aria-label="First" testID="first" />
        <PaginationLast aria-label="Last" testID="last" />
      </Pagination>
    )
    await fireEvent.press(screen.getByTestId("last"))
    expect(onPageChange.mock.lastCall).toMatchObject([
      4,
      { reason: "last-press" },
    ])
    expect(screen.getByTestId("last")).toBeDisabled()
    await fireEvent.press(screen.getByTestId("first"))
    expect(onPageChange.mock.lastCall).toMatchObject([
      1,
      { reason: "first-press" },
    ])
    expect(screen.getByTestId("first")).toBeDisabled()
    expect(screen.getByTestId("last")).toBeEnabled()
  })

  test("a step at its end is disabled for screen readers, still reached, and does nothing", async () => {
    const onPageChange = jest.fn()
    await render(<Pages pageCount={3} onPageChange={onPageChange} />)
    const previous = screen.getByTestId("previous")
    expect(previous.props.accessibilityState).toMatchObject({ disabled: true })
    expect(previous.props.accessible).not.toBe(false)
    await fireEvent.press(previous)
    expect(onPageChange).not.toHaveBeenCalled()
    expect(screen.getByTestId("next")).toBeEnabled()
  })

  test("a step's state says where it goes and whether it's at its end", async () => {
    const style = jest.fn(() => ({}))
    await render(
      <Pagination pageCount={3} defaultPage={3}>
        <PaginationNext aria-label="Next" style={style} />
      </Pagination>
    )
    expect(style.mock.lastCall).toMatchObject([
      { page: 3, disabled: true },
      { pressed: false },
    ])
  })

  test("the list's children get the range, with an ellipsis for each gap", async () => {
    await render(<Pages pageCount={20} defaultPage={10} />)
    expect(
      screen
        .getAllByRole("button")
        .map((node) => node.props.accessibilityLabel ?? "")
    ).toEqual(["Previous", "", "", "", "", "", "Next"])
    for (const name of ["1", "9", "10", "11", "20"]) {
      expect(page(name)).toBeOnTheScreen()
    }
    expect(screen.queryByRole("button", { name: "2" })).toBeNull()
  })

  test("an ellipsis shows a gap that screen readers skip", async () => {
    await render(<Pages pageCount={20} defaultPage={10} />)
    const gap = screen.getByTestId("ellipsis-start", {
      includeHiddenElements: true,
    })
    expect(gap.type).toBe("Text")
    expect(gap).toHaveTextContent("…")
    expect(gap).not.toBeVisible()
  })

  test("a page shows its number unless it has children", async () => {
    await render(
      <Pagination pageCount={3}>
        <PaginationLink page={1} />
        <PaginationLink page={2} aria-label="Page 2">
          {(state) => <Text>{state.current ? "here" : "there"}</Text>}
        </PaginationLink>
      </Pagination>
    )
    expect(page("1")).toHaveTextContent("1")
    expect(page("Page 2")).toHaveTextContent("there")
  })

  test("the controller pages it from outside", async () => {
    const controller = createPaginationController()
    const onPageChange = jest.fn()
    await render(
      <Pages
        pageCount={5}
        controller={controller}
        onPageChange={onPageChange}
      />
    )
    await act(async () => {
      controller.next()
    })
    expect(page("2")).toBeSelected()
    expect(onPageChange.mock.lastCall[1].reason).toBe("imperative")
    await act(async () => {
      controller.last()
    })
    expect(controller.getPage()).toBe(5)
  })

  test("a canceled change keeps the page", async () => {
    await render(
      <Pages
        pageCount={5}
        onPageChange={(_page, details) => details.cancel()}
      />
    )
    await fireEvent.press(page("3"))
    expect(page("1")).toBeSelected()
  })

  test("a controlled pagination follows its owner", async () => {
    const { rerender } = await render(<Pages pageCount={5} page={2} />)
    await fireEvent.press(page("4"))
    expect(page("2")).toBeSelected()
    await rerender(<Pages pageCount={5} page={4} />)
    expect(page("4")).toBeSelected()
  })

  test("total and pageSize give the page count", async () => {
    await render(<Pages total={95} pageSize={20} />)
    expect(page("5")).toBeOnTheScreen()
    expect(screen.queryByRole("button", { name: "6" })).toBeNull()
  })

  test("its views receive no role or ARIA props", async () => {
    await render(<Pages pageCount={10} testID="root" />)
    const names = hostProps().flatMap((props) => Object.keys(props))
    expect(names.filter((name) => /^(aria-|role$|page$|href$)/.test(name))).toEqual([])
  })
})
