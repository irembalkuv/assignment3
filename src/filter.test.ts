// İrem Balkuv - 2200004679
import { describe, it, expect } from 'vitest'
import { filterTasks, countByFilter } from './filter'
import { taskReducer, initialState, type Task } from './taskReducer'

const tasks: Task[] = [
  { id: '1', title: 'One', status: 'todo' },
  { id: '2', title: 'Two', status: 'in-progress' },
  { id: '3', title: 'Three', status: 'done' },
  { id: '4', title: 'Four', status: 'todo' },
]

describe('filterTasks', () => {
  it("returns every task for 'all'", () => {
    expect(filterTasks(tasks, 'all')).toEqual(tasks)
  })

  it('returns only the tasks with the chosen status, in order', () => {
    expect(filterTasks(tasks, 'todo').map((t) => t.id)).toEqual(['1', '4'])
    expect(filterTasks(tasks, 'in-progress').map((t) => t.id)).toEqual(['2'])
    expect(filterTasks(tasks, 'done').map((t) => t.id)).toEqual(['3'])
  })

  it('returns an empty list when nothing matches or the list is empty', () => {
    expect(filterTasks(tasks.slice(0, 1), 'done')).toEqual([])
    expect(filterTasks([], 'all')).toEqual([])
  })

  it('does not change the input array', () => {
    const input: Task[] = [...tasks]
    Object.freeze(input) // a push or sort inside filterTasks would now throw
    filterTasks(input, 'todo')
    expect(input).toEqual(tasks)
  })
})

describe('countByFilter', () => {
  it('counts every filter', () => {
    expect(countByFilter(tasks)).toEqual({ all: 4, todo: 2, 'in-progress': 1, done: 1 })
  })

  it('returns zeros for an empty list', () => {
    expect(countByFilter([])).toEqual({ all: 0, todo: 0, 'in-progress': 0, done: 0 })
  })

  it('is correct after a delete and an advance', () => {
    let s = { ...initialState, tasks }
    s = taskReducer(s, { type: 'remove', id: '3' })
    expect(countByFilter(s.tasks)).toEqual({ all: 3, todo: 2, 'in-progress': 1, done: 0 })
    s = taskReducer(s, { type: 'advance', id: '2' })
    expect(countByFilter(s.tasks)).toEqual({ all: 3, todo: 2, 'in-progress': 0, done: 1 })
  })

  it('the counts of the three statuses add up to all', () => {
    const c = countByFilter(tasks)
    expect(c.todo + c['in-progress'] + c.done).toBe(c.all)
  })
})
