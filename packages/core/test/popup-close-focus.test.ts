import { expect, test } from "vitest"
import { dialog } from "../src/components/dialog/dialog"
import { createStore } from "../src/foundation/kernel/store"
import { createPopupLayer, modalTriple } from "../src/foundation/popups/popup"

function layer(preset: "dialog" | "tooltip" = "dialog") {
  const store = createStore({ open: true, mounted: true }, [])
  const popup = createPopupLayer({
    preset,
    store,
    trigger: () => undefined,
    close: () => {},
    modal: () => modalTriple(true),
  })
  return { store, popup }
}

test("a close's focus mode reads as the close starts, and stays until the next one", () => {
  const { store, popup } = layer()
  popup.returnFocus("unless-moved")
  store.set({ open: false })
  expect(popup.closeFocus()).toBe("unless-moved")
  store.set({ open: true })
  popup.returnFocus(false)
  store.set({ open: false })
  expect(popup.closeFocus()).toBe(false)
  store.set({ open: true })
  store.set({ open: false })
  expect(popup.closeFocus()).toBe(true)
})

test("a popup that never moves focus closes without returning it", () => {
  const { store, popup } = layer("tooltip")
  store.set({ open: false })
  expect(popup.closeFocus()).toBe(false)
})

test("a trigger press opens with the opener its caller passes", () => {
  const instance = dialog({ id: "d" })
  const { internal } = instance.api
  internal.press!.press("t", {}, undefined, "touch")
  expect(instance.get().open).toBe(true)
  expect(internal.popup.opener()).toBe("touch")
})

test("without an opener or an event, a trigger press opens as code would", () => {
  const instance = dialog({ id: "d" })
  instance.api.internal.press!.press("t", {})
  expect(instance.api.internal.popup.opener()).toBe("imperative")
})
