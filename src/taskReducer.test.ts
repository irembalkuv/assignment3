// İrem Balkuv - 2200004679
import { describe, it, expect } from 'vitest'
import { taskReducer, initialState, type State, type Task } from './taskReducer'

const a: Task = { id: 'a', title: 'Write report', status: 'todo' }
const b: Task = { id: 'b', title: 'Read slides', status: 'in-progress' }
const c: Task = { id: 'c', title: 'Buy milk', status: 'done' }

function stateWith(tasks: Task[]): State {
  return { ...initialState, tasks }
}

// Deep-freeze a state so a mutation inside the reducer throws in strict mode.
function freeze(state: State): State {
  state.tasks.forEach((t) => Object.freeze(t))
  state.past.forEach((list) => Object.freeze(list))
  Object.freeze(state.tasks)
  Object.freeze(state.past)
  return Object.freeze(state)
}

describe('initialState', () => {
  it('has no tasks, the filter all and nothing to undo', () => {
    expect(initialState).toEqual({ tasks: [], filter: 'all', past: [] })
  })
})

describe('taskReducer: add', () => {
  it('appends a task with status todo and the id from the action', () => {
    const next = taskReducer(initialState, { type: 'add', id: 'x1', title: 'New' })
    expect(next.tasks).toEqual([{ id: 'x1', title: 'New', status: 'todo' }])
  })

  it('adds to the end of an existing list', () => {
    const next = taskReducer(stateWith([a]), { type: 'add', id: 'x2', title: 'Second' })
    expect(next.tasks.map((t) => t.id)).toEqual(['a', 'x2'])
  })
})

describe('taskReducer: advance', () => {
  it('moves todo to in-progress', () => {
    const next = taskReducer(stateWith([a]), { type: 'advance', id: 'a' })
    expect(next.tasks[0].status).toBe('in-progress')
  })

  it('returns to todo after three advances', () => {
    let s = stateWith([a])
    s = taskReducer(s, { type: 'advance', id: 'a' })
    expect(s.tasks[0].status).toBe('in-progress')
    s = taskReducer(s, { type: 'advance', id: 'a' })
    expect(s.tasks[0].status).toBe('done')
    s = taskReducer(s, { type: 'advance', id: 'a' })
    expect(s.tasks[0].status).toBe('todo')
  })

  it('changes only the task with that id', () => {
    const next = taskReducer(stateWith([a, b]), { type: 'advance', id: 'a' })
    expect(next.tasks[1]).toBe(b)
  })

  it('does nothing for an unknown id', () => {
    const s = stateWith([a, b])
    expect(taskReducer(s, { type: 'advance', id: 'nope' })).toBe(s)
  })
})

describe('taskReducer: remove', () => {
  it('deletes the task with that id', () => {
    const next = taskReducer(stateWith([a, b, c]), { type: 'remove', id: 'b' })
    expect(next.tasks.map((t) => t.id)).toEqual(['a', 'c'])
  })

  it('does nothing for an unknown id', () => {
    const s = stateWith([a])
    expect(taskReducer(s, { type: 'remove', id: 'nope' })).toBe(s)
  })

  it('does nothing on an empty list', () => {
    expect(taskReducer(initialState, { type: 'remove', id: 'a' })).toBe(initialState)
  })
})

describe('taskReducer: setFilter', () => {
  it('stores the filter and keeps the same tasks', () => {
    const s = stateWith([a, b])
    const next = taskReducer(s, { type: 'setFilter', filter: 'done' })
    expect(next.filter).toBe('done')
    expect(next.tasks).toBe(s.tasks)
  })
})

describe('taskReducer: clearDone', () => {
  it('removes every done task and keeps the filter', () => {
    const s: State = { ...stateWith([a, b, c]), filter: 'in-progress' }
    const next = taskReducer(s, { type: 'clearDone' })
    expect(next.tasks.map((t) => t.id)).toEqual(['a', 'b'])
    expect(next.filter).toBe('in-progress')
  })

  it('does nothing when no task is done', () => {
    const s = stateWith([a, b])
    expect(taskReducer(s, { type: 'clearDone' })).toBe(s)
  })

  it('works on an empty list', () => {
    expect(taskReducer(initialState, { type: 'clearDone' }).tasks).toEqual([])
  })
})

describe('taskReducer: purity', () => {
  it('never changes the old state (frozen state, every action)', () => {
    const s = freeze(stateWith([a, b, c]))
    const copy = structuredClone(s)
    taskReducer(s, { type: 'add', id: 'z', title: 'Z' })
    taskReducer(s, { type: 'advance', id: 'a' })
    taskReducer(s, { type: 'remove', id: 'b' })
    taskReducer(s, { type: 'setFilter', filter: 'todo' })
    taskReducer(s, { type: 'clearDone' })
    taskReducer(s, { type: 'undo' })
    expect(s).toEqual(copy)
  })

  it('returns a new state object and a new tasks array when tasks change', () => {
    const s = stateWith([a])
    const next = taskReducer(s, { type: 'advance', id: 'a' })
    expect(next).not.toBe(s)
    expect(next.tasks).not.toBe(s.tasks)
    expect(next.tasks[0]).not.toBe(s.tasks[0])
  })
})

describe('taskReducer: undo (Bonus 1)', () => {
  it('does nothing when there is nothing to undo', () => {
    expect(taskReducer(initialState, { type: 'undo' })).toBe(initialState)
  })

  it('reverts add, advance and remove one step at a time', () => {
    let s = initialState
    s = taskReducer(s, { type: 'add', id: 'a', title: 'A' })
    s = taskReducer(s, { type: 'advance', id: 'a' })
    s = taskReducer(s, { type: 'remove', id: 'a' })
    expect(s.tasks).toEqual([])
    s = taskReducer(s, { type: 'undo' })
    expect(s.tasks).toEqual([{ id: 'a', title: 'A', status: 'in-progress' }])
    s = taskReducer(s, { type: 'undo' })
    expect(s.tasks).toEqual([{ id: 'a', title: 'A', status: 'todo' }])
    s = taskReducer(s, { type: 'undo' })
    expect(s.tasks).toEqual([])
    expect(s.past).toEqual([])
  })

  it('brings cleared tasks back after clearDone', () => {
    let s = stateWith([a, b, c])
    s = taskReducer(s, { type: 'clearDone' })
    s = taskReducer(s, { type: 'undo' })
    expect(s.tasks).toEqual([a, b, c])
  })

  it('does not record filter changes', () => {
    let s = stateWith([a])
    s = taskReducer(s, { type: 'setFilter', filter: 'done' })
    expect(s.past).toEqual([])
    s = taskReducer(s, { type: 'add', id: 'x', title: 'X' })
    s = taskReducer(s, { type: 'setFilter', filter: 'todo' })
    s = taskReducer(s, { type: 'undo' })
    expect(s.tasks).toEqual([a])
    expect(s.filter).toBe('todo')
  })

  it('does not record actions that changed nothing', () => {
    const s = taskReducer(stateWith([a]), { type: 'remove', id: 'nope' })
    expect(s.past).toEqual([])
  })
})
