/**
 * What a press on a field's label does: a native `<label>` for the control
 * leaves it to the browser, and any other label activates the control. Its
 * native twin asks the native host to activate the control that joined the field.
 */
function pressLabel(
  part: {
    el: HTMLElement | undefined
    api: { activate: (event?: Event) => void; disabled: () => boolean }
  },
  event?: Event
) {
  if (part.el instanceof HTMLLabelElement && part.el.control) {
    return
  }
  part.api.activate(event)
}

export { pressLabel }
