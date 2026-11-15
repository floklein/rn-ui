import { warn } from "#dev"
import { host } from "./host"

function describeHost() {
  warn("described")
  return host
}

export { describeHost }
