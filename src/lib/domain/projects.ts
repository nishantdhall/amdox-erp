import type { Project, ProjectTask } from '../types'
import { daysBetween, round, sum } from '../utils'

/**
 * Project scheduling helpers (F-07): dependency validation, critical path and
 * budget variance.
 */

export class CyclicDependencyError extends Error {
  constructor(public readonly cycle: string[]) {
    super(`Task dependencies form a cycle: ${cycle.join(' → ')}`)
    this.name = 'CyclicDependencyError'
  }
}

/**
 * Topologically sort tasks, throwing if `dependsOn` contains a cycle.
 * Uses iterative DFS with a colour map so deep graphs cannot blow the stack.
 */
export function topoSort(tasks: ProjectTask[]): ProjectTask[] {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const colour = new Map<string, 'white' | 'grey' | 'black'>()
  const order: ProjectTask[] = []

  for (const task of tasks) colour.set(task.id, 'white')

  for (const root of tasks) {
    if (colour.get(root.id) !== 'white') continue

    const stack: { id: string; path: string[] }[] = [{ id: root.id, path: [] }]
    while (stack.length) {
      const frame = stack[stack.length - 1]
      const current = byId.get(frame.id)
      if (!current) {
        stack.pop()
        continue
      }

      if (colour.get(frame.id) === 'white') {
        colour.set(frame.id, 'grey')
        for (const dep of current.dependsOn) {
          if (!byId.has(dep)) continue
          if (colour.get(dep) === 'grey') {
            throw new CyclicDependencyError([...frame.path, current.name, byId.get(dep)!.name])
          }
          if (colour.get(dep) === 'white') {
            stack.push({ id: dep, path: [...frame.path, current.name] })
          }
        }
      } else {
        if (colour.get(frame.id) === 'grey') {
          colour.set(frame.id, 'black')
          order.push(current)
        }
        stack.pop()
      }
    }
  }

  return order
}

export function hasCycle(tasks: ProjectTask[]): boolean {
  try {
    topoSort(tasks)
    return false
  } catch (error) {
    return error instanceof CyclicDependencyError
  }
}

/**
 * Longest dependency chain by duration — the tasks that determine the project
 * end date. Returns the set of task ids on that path.
 */
export function criticalPath(tasks: ProjectTask[]): Set<string> {
  const ordered = topoSort(tasks)
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const longest = new Map<string, { length: number; from: string | null }>()

  for (const task of ordered) {
    const duration = Math.max(1, daysBetween(task.startDate, task.endDate))
    let best = { length: duration, from: null as string | null }

    for (const dep of task.dependsOn) {
      const prior = longest.get(dep)
      if (!prior) continue
      const candidate = prior.length + duration
      if (candidate > best.length) best = { length: candidate, from: dep }
    }

    longest.set(task.id, best)
  }

  let tail: string | null = null
  let max = -1
  for (const [id, entry] of longest) {
    if (entry.length > max) {
      max = entry.length
      tail = id
    }
  }

  const path = new Set<string>()
  let cursor = tail
  while (cursor) {
    path.add(cursor)
    cursor = longest.get(cursor)?.from ?? null
    if (cursor && !byId.has(cursor)) break
  }

  return path
}

export interface BudgetVariance {
  budget: number
  actual: number
  variance: number
  variancePct: number
  /** Fires when actual exceeds budget by more than 10% (the F-07 criterion). */
  overrun: boolean
  forecastAtCompletion: number
}

export function budgetVariance(project: Project): BudgetVariance {
  const variance = round(project.actualCost - project.budget)
  const variancePct = project.budget === 0 ? 0 : round((variance / project.budget) * 100, 1)
  const progress = Math.max(0.01, project.progressPct / 100)

  return {
    budget: project.budget,
    actual: project.actualCost,
    variance,
    variancePct,
    overrun: variancePct > 10,
    forecastAtCompletion: round(project.actualCost / progress),
  }
}

/** Percentage of each employee's capacity already committed to open tasks. */
export function resourceUtilisation(tasks: ProjectTask[], capacityHours = 160): Map<string, number> {
  const byAssignee = new Map<string, number>()
  for (const task of tasks) {
    if (!task.assigneeId || task.status === 'Done') continue
    byAssignee.set(task.assigneeId, (byAssignee.get(task.assigneeId) ?? 0) + task.estimateHours)
  }

  const utilisation = new Map<string, number>()
  for (const [assignee, hours] of byAssignee) {
    utilisation.set(assignee, round((hours / capacityHours) * 100, 0))
  }
  return utilisation
}

export function projectProgress(tasks: ProjectTask[]): number {
  if (tasks.length === 0) return 0
  return round(sum(tasks.map((t) => t.progressPct)) / tasks.length, 0)
}
