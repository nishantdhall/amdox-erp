import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create a Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { companyCode: 'DEFAULT' },
    update: {},
    create: {
      companyName: 'Amdox Corp',
      companyCode: 'DEFAULT',
      domain: 'amdox.local',
      contactEmail: 'admin@amdox.com',
      status: 'ACTIVE',
    },
  })
  console.log(`Tenant created/found: ${tenant.companyName} (${tenant.id})`)

  // 2. Define System Permissions
  const resources = ['users', 'roles', 'permissions', 'employees', 'departments', 'attendance', 'leave_requests', 'payrolls']
  const actions = ['create', 'read', 'update', 'delete']

  const permissionRecords = []

  for (const resource of resources) {
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: {
          resource_action_tenantId: {
            resource,
            action,
            tenantId: tenant.id,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          resource,
          action,
          description: `Can ${action} ${resource}`,
          isSystem: true,
          status: 'ACTIVE',
        },
      })
      permissionRecords.push(perm)
    }
  }
  console.log(`Seeded ${permissionRecords.length} permissions.`)

  // 3. Define Roles
  const roles = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'System-wide super administrator' },
    { code: 'TENANT_ADMIN', name: 'Tenant Administrator', description: 'Tenant-wide administrator' },
    { code: 'MANAGER', name: 'Manager', description: 'Department manager' },
    { code: 'EMPLOYEE', name: 'Employee', description: 'Regular staff member' },
  ]

  const seededRoles: Record<string, any> = {}

  for (const role of roles) {
    const seededRole = await prisma.role.upsert({
      where: {
        code_tenantId: {
          code: role.code,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        code: role.code,
        name: role.name,
        description: role.description,
        isSystem: true,
        status: 'ACTIVE',
      },
    })
    seededRoles[role.code] = seededRole
  }
  console.log('Seeded roles.')

  // 4. Assign Permissions to Roles
  // SUPER_ADMIN and TENANT_ADMIN get all permissions
  for (const perm of permissionRecords) {
    // SUPER_ADMIN
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: seededRoles['SUPER_ADMIN'].id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        roleId: seededRoles['SUPER_ADMIN'].id,
        permissionId: perm.id,
      },
    })

    // TENANT_ADMIN
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: seededRoles['TENANT_ADMIN'].id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        roleId: seededRoles['TENANT_ADMIN'].id,
        permissionId: perm.id,
      },
    })

    // MANAGER gets read/update on users, read on all others, and read/update on attendance/leave/payrolls
    const isManagerPerm =
      (['users', 'employees', 'departments', 'attendance', 'leave_requests', 'payrolls'].includes(perm.resource) &&
        ['read', 'update'].includes(perm.action)) ||
      perm.action === 'read'

    if (isManagerPerm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: seededRoles['MANAGER'].id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          roleId: seededRoles['MANAGER'].id,
          permissionId: perm.id,
        },
      })
    }

    // EMPLOYEE gets read on resource matching, and own attendance/leave/payrolls creation/reading
    const isEmployeePerm =
      perm.action === 'read' ||
      (['attendance', 'leave_requests'].includes(perm.resource) && ['create', 'read'].includes(perm.action))

    if (isEmployeePerm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: seededRoles['EMPLOYEE'].id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          roleId: seededRoles['EMPLOYEE'].id,
          permissionId: perm.id,
        },
      })
    }
  }
  console.log('Assigned permissions to roles.')

  // 5. Seed Users
  // Pre-computed hash of "password123"
  const passwordHash = '$2b$10$EPY97jD6r4v5O4G4aO9yruqJ0yI4f9Ld8iYvI2.mPqDq5HjS.26O.'

  const users = [
    { email: 'superadmin@amdox.com', firstName: 'Super', lastName: 'Admin', role: 'SUPER_ADMIN' },
    { email: 'tenantadmin@amdox.com', firstName: 'Tenant', lastName: 'Admin', role: 'TENANT_ADMIN' },
    { email: 'manager@amdox.com', firstName: 'Jane', lastName: 'Manager', role: 'MANAGER' },
    { email: 'employee@amdox.com', firstName: 'John', lastName: 'Employee', role: 'EMPLOYEE' },
  ]

  for (const user of users) {
    const dbUser = await prisma.user.upsert({
      where: {
        email_tenantId: {
          email: user.email,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        passwordHash,
        role: user.role,
        status: 'ACTIVE',
      },
    })

    // Assign Role in user_roles table
    const targetRole = seededRoles[user.role]
    if (targetRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: dbUser.id,
            roleId: targetRole.id,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          userId: dbUser.id,
          roleId: targetRole.id,
        },
      })
    }
  }
  console.log('Seeded users and user role mappings.')

  console.log('Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
