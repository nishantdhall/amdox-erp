import { z } from 'zod'
import { apiRoute } from '@/lib/api/handler'
import { getProject, listTasks, updateTask } from '@/lib/db/repo'
import { criticalPath, hasCycle, resourceUtilisation } from '@/lib/domain/projects'

const taskPatch = z.object({
  taskId: z.string().min(1),
  status: z.enum(['Todo', 'In Progress', 'Blocked', 'Done']).optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
  assigneeId: z.string().nullable().optional(),
})

type Params = { id: string }

export const GET = apiRoute<Params>({ permission: 'project.view' }, async ({ session, params }) => {
  const project = getProject(session.tenantId, params.id)
  const tasks = listTasks(session.tenantId, project.id)
  const path = criticalPath(tasks)

  return {
    project,
    tasks: tasks.map((task) => ({ ...task, onCriticalPath: path.has(task.id) })),
    criticalPathLength: path.size,
    acyclic: !hasCycle(tasks),
    utilisation: Object.fromEntries(resourceUtilisation(tasks)),
  }
})

export const PATCH = apiRoute<Params>({ permission: 'project.manage' }, async ({ session, audit, body }) => {
  const input = await body(taskPatch)
  const { taskId, ...patch } = input
  return updateTask(session.tenantId, taskId, patch, audit)
})
