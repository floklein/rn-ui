import { isFramework } from "./frameworks"
import { publishedNames } from "./published-names"

type Node = { type: string; value?: string; children?: Node[] }

const shown = ["text", "inlineCode", "code"]

function remarkPublishedNames() {
  return (tree: Node, file: { path: string }) => {
    const section = /content[\\/]docs[\\/]([^\\/]+)[\\/]/.exec(file.path)?.[1]
    if (!section || !isFramework(section)) {
      return
    }
    const visit = (node: Node) => {
      if (node.value !== undefined && shown.includes(node.type)) {
        node.value = publishedNames(node.value, section)
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}

export { remarkPublishedNames }
