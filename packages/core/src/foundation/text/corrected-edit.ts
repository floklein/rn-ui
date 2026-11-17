type TextSelection = { start: number; end: number }

function commonPrefix(a: string, b: string) {
  let length = 0
  while (length < a.length && length < b.length && a[length] === b[length]) {
    length++
  }
  return length
}

function isDeletion(previous: string, text: string) {
  const start = commonPrefix(previous, text)
  return (
    text.length < previous.length &&
    previous.endsWith(text.slice(start)) &&
    previous.length - (text.length - start) >= start
  )
}

// A native field reports an edit's whole text after it shows, so the
// selection it last reported says what replaced what. Deleting is always
// accepted, as the web never refuses it.
function createCorrectedEdit() {
  let selection: TextSelection | undefined
  // The caret the field reports for the refused text, after the write back.
  let refusedCaret: number | undefined

  return {
    /**
     * Takes the field's new text. Returns `undefined` when `accepts` takes
     * it, or the selection to write back with `previous` otherwise.
     */
    edit(previous: string, text: string, accepts: (text: string) => boolean) {
      refusedCaret = undefined
      if (isDeletion(previous, text) || accepts(text)) {
        selection = undefined
        return undefined
      }
      const known =
        selection &&
        selection.end <= previous.length &&
        text.startsWith(previous.slice(0, selection.start)) &&
        text.endsWith(previous.slice(selection.end))
      const start = known ? selection!.start : commonPrefix(previous, text)
      const end = known ? selection!.end : start
      refusedCaret = start + text.length - (previous.length - end)
      selection = { start, end }
      return selection
    },
    /**
     * Takes the selection the field reports. Returns `false` for the refused
     * text's caret, which the field reports after the write back.
     */
    select(current: TextSelection) {
      const refused =
        refusedCaret !== undefined &&
        current.start === refusedCaret &&
        current.end === refusedCaret
      refusedCaret = undefined
      if (refused) {
        return false
      }
      selection = current
      return true
    },
  }
}

export { createCorrectedEdit, type TextSelection }
