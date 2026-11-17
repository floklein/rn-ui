import {
  initialState,
  next,
  type SheetEffect,
  type SheetEvent,
  type SheetState,
} from "../../foundation/motion/machine"
import { projectDistance } from "../../foundation/motion/projection"
import { settleTime, solveSpring } from "../../foundation/motion/spring"
import { createVelocityTracker } from "../../foundation/motion/velocity"
import { partOf } from "../../foundation/kernel/native-element"
import {
  nativeHost,
  type NativeTouch,
} from "../../foundation/kernel/native-host"
import type { Twin } from "../../foundation/kernel/twin"
import { clamp } from "../../foundation/number/steps"
import { nearestPage } from "./carousel-layout"
import type { CarouselMotionOptions } from "./carousel-motion"
import { moveTrack } from "./carousel-native"
import type * as Mirrored from "./carousel-motion"
import type * as Native from "./carousel-motion.native"

const freeDecelerationRate = 0.998

// The web's mouse drag, fed by the responder's touches: the content follows
// the finger and springs from the release velocity to the page the
// projection picks. Its position goes to the adapter, which translates the
// content, since nothing scrolls natively.
function createCarouselMotion(options: CarouselMotionOptions) {
  const viewport = partOf(options.viewport)
  const api = viewport?.api
  let state: SheetState = initialState(0, 0)
  let spring: { frame: number; to: number } | null = null
  let at = 0
  let touching = false
  let dragging = false
  let destroyed = false
  const point = { x: 0, y: 0 }
  const tracker = createVelocityTracker()

  const position = () => at

  function write(target: number) {
    if (destroyed) {
      return
    }
    at = clamp(target, 0, options.maxScroll())
    if (api) {
      moveTrack(api, target)
    }
    options.onScroll()
  }

  function config() {
    return {
      snapPoints: options
        .positions()
        .map((extent, index) => ({ id: String(index), extent })),
      dimension: options.viewportSize(),
      dismissible: false,
      expandOnScroll: false,
      physics: options.physics(),
    }
  }

  const pagesAt = () => options.positions().map((position) => ({ position }))

  function restHere() {
    state = initialState(at, Math.max(0, nearestPage(pagesAt(), at)))
  }

  function dispatch(event: SheetEvent) {
    if (destroyed || options.positions().length === 0) {
      return
    }
    const result = next(state, event, config())
    state = result.state
    setDragging(state.phase === "dragging")
    const time = "time" in event ? event.time : performance.now()
    for (const effect of result.effects) {
      run(effect, time, event)
    }
  }

  function setDragging(value: boolean) {
    if (value === dragging) {
      return
    }
    dragging = value
    options.onDragChange(value)
  }

  function run(effect: SheetEffect, time: number, event: SheetEvent) {
    if (effect.type === "move") {
      stopSpring()
      return write(effect.extent)
    }
    if (effect.type === "settle") {
      return startSpring(effect, time)
    }
    if (
      effect.type === "snap" &&
      effect.reason === "swipe" &&
      event.type === "up"
    ) {
      options.onRelease(Number(effect.id))
    }
  }

  function startSpring(
    effect: Extract<SheetEffect, { type: "settle" }>,
    startTime: number
  ) {
    stopSpring()
    const { from, to, velocity } = effect
    const isStill = Math.abs(to - from) < 0.5 && Math.abs(velocity) < 0.01
    if (isStill || options.reducedMotion()) {
      write(to)
      return finishSpring()
    }
    const solver = solveSpring(
      effect.response,
      effect.dampingRatio,
      from - to,
      velocity
    )
    const duration = settleTime(solver)
    const running = { frame: 0, to }
    const step = (now: number) => {
      if (spring !== running) {
        return
      }
      const elapsed = now - startTime
      if (elapsed >= duration) {
        write(running.to)
        return finishSpring()
      }
      write(running.to + solver.position(Math.max(0, elapsed)))
      running.frame = requestAnimationFrame(step)
    }
    spring = running
    running.frame = requestAnimationFrame(step)
  }

  function stopSpring() {
    if (spring) {
      cancelAnimationFrame(spring.frame)
    }
    spring = null
  }

  function finishSpring() {
    spring = null
    dispatch({ type: "settled" })
    if (state.phase === "idle") {
      options.onSettle()
    }
  }

  // The touch as the machine reads it: `y` along the axis, growing the way scrolling shrinks.
  function axisPoint(touch: NativeTouch) {
    const { vertical, rtl } = options.axis()
    point.y = vertical ? touch.y : rtl ? -touch.x : touch.x
    point.x = vertical ? touch.x : touch.y
    return point
  }

  function releaseFree(time: number, fingerVelocity: number) {
    if (state.phase !== "dragging") {
      return
    }
    const velocity = -fingerVelocity
    const target = clamp(
      state.extent + projectDistance(velocity, freeDecelerationRate),
      0,
      options.maxScroll()
    )
    const physics = options.physics()
    const index = Math.max(0, nearestPage(pagesAt(), target))
    state = {
      phase: "settling",
      extent: state.extent,
      restingIndex: state.restingIndex,
      targetIndex: index,
      from: state.extent,
      to: target,
      velocity,
      response: physics.response,
      dampingRatio: 1,
      startTime: time,
    }
    setDragging(false)
    startSpring({ type: "settle", ...state }, time)
    options.onRelease(index)
  }

  // Taken from a button inside a slide once it moves along the axis.
  function claims(dx: number, dy: number) {
    const { vertical } = options.axis()
    const along = Math.abs(vertical ? dy : dx)
    const across = Math.abs(vertical ? dx : dy)
    return along >= options.physics().touchSlop && along > across
  }

  const unfollow =
    viewport &&
    nativeHost()?.follow(viewport, {
      accepts: options.canDrag,
      claims,
      start(touch) {
        const time = performance.now()
        touching = true
        if (state.phase === "idle") {
          restHere()
        }
        tracker.reset()
        tracker.add(time, axisPoint(touch).y)
        dispatch({ type: "down", time, ...point, pointer: "touch" })
      },
      move(touch) {
        const time = performance.now()
        tracker.add(time, axisPoint(touch).y)
        dispatch({ type: "move", time, ...point, scroll: null })
      },
      end() {
        touching = false
        const time = performance.now()
        const velocity = tracker.velocity(time)
        if (state.phase === "dragging" && options.dragFree()) {
          releaseFree(time, velocity)
        } else {
          dispatch({ type: "up", time, velocity })
        }
      },
      // A drag a scroll view or the system takes goes back to its page.
      cancel() {
        touching = false
        const { restingIndex } = state
        state = initialState(at, restingIndex)
        setDragging(false)
        dispatch({
          type: "snap-to",
          time: performance.now(),
          id: String(restingIndex),
          reason: "imperative",
        })
      },
    })

  return {
    position,
    /** Whether the user holds it: a finger down, or a drag. */
    isHeld: () => touching || dragging,
    /** Whether it's held, or a spring is moving it, so new layout shouldn't jump it. */
    isMoving: () => touching || dragging || spring !== null,
    /** Moves to a page index: springs there from wherever it is, or jumps without `animate`. */
    moveTo(index: number, { animate = true } = {}) {
      const positions = options.positions()
      if (destroyed || index < 0 || index >= positions.length) {
        return
      }
      if (touching || dragging) {
        return
      }
      if (!animate) {
        stopSpring()
        write(positions[index])
        state = initialState(positions[index], index)
        return
      }
      if (state.phase === "idle") {
        restHere()
      }
      dispatch({
        type: "snap-to",
        time: performance.now(),
        id: String(index),
        reason: "imperative",
      })
    },
    /** Moves from `from` by `delta` after a looping track rotated, with a running spring. */
    shift(from: number, delta: number, remap: (index: number) => number) {
      if (destroyed) {
        return
      }
      if (spring) {
        spring.to += delta
      }
      if (state.phase === "settling") {
        state = {
          ...state,
          extent: state.extent + delta,
          from: state.from + delta,
          to: state.to + delta,
          restingIndex: remap(state.restingIndex),
          targetIndex: remap(state.targetIndex),
        }
      }
      write(from + delta)
      if (state.phase === "idle") {
        restHere()
      }
    },
    destroy() {
      destroyed = true
      stopSpring()
      unfollow?.()
      touching = false
      if (dragging) {
        options.onDragChange(false)
      }
    },
  }
}

true satisfies Twin<typeof Mirrored, typeof Native>

export { createCarouselMotion }
