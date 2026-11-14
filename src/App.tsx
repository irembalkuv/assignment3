// İrem Balkuv - 2200004679
// The state lives in App with useReducer and goes down to the components as props.
import { useReducer } from 'react'
import type { Dispatch } from 'react'
import { taskReducer, initialState, type Task, type Action } from './taskReducer'
import { FILTERS, filterTasks, countByFilter, type Filter } from './filter'
import TaskRow from './TaskRow'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
}

function AddForm({ dispatch }: { dispatch: Dispatch<Action> }) {
  function addTask(formData: FormData) {
    const title = String(formData.get('title') ?? '').trim()
    // The id is created here, in the event handler, so the reducer stays pure.
    if (title) dispatch({ type: 'add', id: crypto.randomUUID(), title })
  }
  return (
    <form action={addTask}>
      <input name="title" placeholder="New task" />
      <button type="submit">Add</button>
    </form>
  )
}

type FilterBarProps = {
  filter: Filter
  counts: Record<Filter, number>
  dispatch: Dispatch<Action>
}

function FilterBar({ filter, counts, dispatch }: FilterBarProps) {
  return (
    <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
      {FILTERS.map((f) => {
        const active = f === filter
        return (
          <button
            key={f}
            type="button"
            aria-pressed={active}
            onClick={() => dispatch({ type: 'setFilter', filter: f })}
            style={{
              fontWeight: active ? 'bold' : 'normal',
              background: active ? '#2563eb' : '#f3f4f6',
              color: active ? 'white' : 'black',
              border: '1px solid #9ca3af',
              borderRadius: 6,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            {FILTER_LABELS[f]} ({counts[f]})
          </button>
        )
      })}
    </div>
  )
}

function TaskList({ tasks, dispatch }: { tasks: Task[]; dispatch: Dispatch<Action> }) {
  if (tasks.length === 0) return <p>No tasks here.</p>
  return (
    <ul>
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          onNext={() => dispatch({ type: 'advance', id: t.id })}
          onDelete={() => dispatch({ type: 'remove', id: t.id })}
        />
      ))}
    </ul>
  )
}

export default function App() {
  const [state, dispatch] = useReducer(taskReducer, initialState)

  // Derived while rendering, never stored in state (R6).
  const visibleTasks = filterTasks(state.tasks, state.filter)
  const counts = countByFilter(state.tasks)

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '24px auto' }}>
      <h1>Task Manager</h1>
      <AddForm dispatch={dispatch} />
      <FilterBar filter={state.filter} counts={counts} dispatch={dispatch} />
      <TaskList tasks={visibleTasks} dispatch={dispatch} />
      <button
        type="button"
        onClick={() => dispatch({ type: 'clearDone' })}
        disabled={counts.done === 0}
      >
        Clear done
      </button>
    </main>
  )
}
