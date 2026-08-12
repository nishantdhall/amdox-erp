import { apiRoute, paginate } from '@/lib/api/handler'
import { listProjects, listTasks } from '@/lib/db/repo'
import { budgetVariance } from '@/lib/domain/projects'

export const GET = apiRoute({ permission: 'project.view' }, async ({ session, query }) => {
  const tasks = listTasks(session.tenantId)
  const rows = listProjects(session.tenantId).map((project) => {
    const own = tasks.filter((t) => t.projectId === project.id)
    return {
      ...project,
      variance: budgetVariance(project),
      taskCount: own.length,
      openTasks: own.filter((t) => t.status !== 'Done').length,
      blockedTasks: own.filter((t) => t.status === 'Blocked').length,
    }
  })
  return paginate(rows, query)
})
