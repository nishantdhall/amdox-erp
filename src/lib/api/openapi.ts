/**
 * OpenAPI 3.1 description of the AMDOX REST surface (F-11).
 *
 * Served verbatim at `/api/v1/openapi.json` and rendered by `/api-docs`, so the
 * published contract and the browsable documentation cannot disagree.
 */

const errorResponse = {
  description: 'Error envelope',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
}

function listOp(tag: string, summary: string, itemRef: string, params: object[] = []) {
  return {
    tags: [tag],
    summary,
    parameters: [
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
      { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } },
      ...params,
    ],
    responses: {
      200: {
        description: 'Paginated collection',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: { type: 'array', items: { $ref: itemRef } },
                meta: { $ref: '#/components/schemas/PageMeta' },
              },
            },
          },
        },
      },
      401: errorResponse,
      403: errorResponse,
      429: errorResponse,
    },
  }
}

export function openApiDocument(origin = 'https://amdox-erp.vercel.app') {
  return {
    openapi: '3.1.0',
    info: {
      title: 'AMDOX ERP API',
      version: '1.0.0',
      summary: 'AI-Powered Cloud ERP Suite — REST API',
      description:
        'Multi-tenant ERP API covering finance, HR & payroll, supply chain, projects, demand forecasting, ' +
        'notifications and the immutable audit trail. All endpoints are tenant-scoped by the session cookie ' +
        'and rate limited per client.',
      contact: { name: 'Amdox Technologies — Engineering Division', email: 'support@amdox.in' },
      license: { name: 'Proprietary — Internal', identifier: 'LicenseRef-Amdox-Internal' },
    },
    servers: [{ url: `${origin}/api/v1`, description: 'Primary' }],
    tags: [
      { name: 'System', description: 'Health, spec and demo utilities' },
      { name: 'Auth', description: 'Session lifecycle' },
      { name: 'HR', description: 'Employees, attendance and leave' },
      { name: 'Payroll', description: 'Payroll runs and payslips' },
      { name: 'Finance', description: 'General ledger, AP/AR and period close' },
      { name: 'Supply Chain', description: 'Inventory, vendors and purchase orders' },
      { name: 'Projects', description: 'Projects and tasks' },
      { name: 'Forecasting', description: 'AI demand forecasting' },
      { name: 'Analytics', description: 'Business intelligence aggregates' },
      { name: 'Notifications', description: 'Event delivery and preferences' },
      { name: 'Audit', description: 'Immutable, hash-chained audit trail' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Liveness and readiness probe',
          security: [],
          responses: {
            200: {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['ok'] },
                      version: { type: 'string' },
                      uptimeSeconds: { type: 'number' },
                      checks: { type: 'object', additionalProperties: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/openapi.json': {
        get: { tags: ['System'], summary: 'This document', security: [], responses: { 200: { description: 'OpenAPI 3.1 document' } } },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Exchange credentials for a session cookie',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Authenticated; `amdox_session` cookie is set' },
            401: errorResponse,
            429: errorResponse,
          },
        },
      },
      '/auth/session': {
        get: { tags: ['Auth'], summary: 'Describe the current session', responses: { 200: { description: 'Session' }, 401: errorResponse } },
        delete: { tags: ['Auth'], summary: 'Sign out', responses: { 200: { description: 'Signed out' } } },
      },
      '/employees': {
        get: listOp('HR', 'List employees', '#/components/schemas/Employee', [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'departmentId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Active', 'On Leave', 'Probation', 'Exited'] } },
        ]),
        post: {
          tags: ['HR'],
          summary: 'Create an employee',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/EmployeeInput' } } } },
          responses: { 201: { description: 'Created' }, 409: errorResponse, 422: errorResponse },
        },
      },
      '/employees/{id}': {
        get: {
          tags: ['HR'],
          summary: 'Fetch one employee',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Employee' }, 404: errorResponse },
        },
        patch: {
          tags: ['HR'],
          summary: 'Update an employee',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/EmployeeInput' } } } },
          responses: { 200: { description: 'Updated' }, 404: errorResponse },
        },
        delete: {
          tags: ['HR'],
          summary: 'Soft-delete an employee',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' }, 404: errorResponse },
        },
      },
      '/departments': { get: listOp('HR', 'List departments', '#/components/schemas/Department') },
      '/attendance': {
        get: listOp('HR', 'List attendance records', '#/components/schemas/Attendance', [
          { name: 'employeeId', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ]),
        post: {
          tags: ['HR'],
          summary: 'Clock in or clock out',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['action', 'employeeId'],
                  properties: { action: { type: 'string', enum: ['clock-in', 'clock-out'] }, employeeId: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Attendance record' }, 409: errorResponse },
        },
      },
      '/leave': {
        get: listOp('HR', 'List leave requests', '#/components/schemas/LeaveRequest', [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'] } },
        ]),
        post: {
          tags: ['HR'],
          summary: 'Apply for leave',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LeaveInput' } } } },
          responses: { 201: { description: 'Created' }, 422: errorResponse },
        },
      },
      '/leave/{id}': {
        patch: {
          tags: ['HR'],
          summary: 'Approve or reject a leave request',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['decision'],
                  properties: { decision: { type: 'string', enum: ['Approved', 'Rejected'] }, note: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Decided' }, 409: errorResponse },
        },
      },
      '/payroll': {
        get: listOp('Payroll', 'List payroll runs', '#/components/schemas/PayrollRun'),
        post: {
          tags: ['Payroll'],
          summary: 'Execute a payroll run and post the accrual journal',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', required: ['period'], properties: { period: { type: 'string', pattern: '^\\d{4}-\\d{2}$' } } },
              },
            },
          },
          responses: { 201: { description: 'Run completed' }, 409: errorResponse },
        },
      },
      '/payroll/{runId}/payslips': {
        get: {
          tags: ['Payroll'],
          summary: 'Payslips generated by a run',
          parameters: [{ name: 'runId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Payslips' } },
        },
      },
      '/finance/accounts': { get: listOp('Finance', 'Chart of accounts', '#/components/schemas/Account') },
      '/finance/journals': {
        get: listOp('Finance', 'List journal entries', '#/components/schemas/JournalEntry', [
          { name: 'period', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Draft', 'Posted', 'Reversed'] } },
        ]),
        post: {
          tags: ['Finance'],
          summary: 'Post a balanced journal entry',
          description: 'Rejects unbalanced line sets with 422 and postings into a closed period with 409.',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/JournalInput' } } } },
          responses: { 201: { description: 'Posted' }, 409: errorResponse, 422: errorResponse },
        },
      },
      '/finance/journals/{id}/reverse': {
        post: {
          tags: ['Finance'],
          summary: 'Reverse a posted entry with a mirrored contra entry',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 201: { description: 'Reversal posted' }, 409: errorResponse },
        },
      },
      '/finance/trial-balance': {
        get: {
          tags: ['Finance'],
          summary: 'Trial balance, income statement and balance sheet',
          parameters: [
            { name: 'from', in: 'query', schema: { type: 'string' } },
            { name: 'to', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Financial statements' } },
        },
      },
      '/finance/periods': {
        get: listOp('Finance', 'List accounting periods', '#/components/schemas/Period'),
        post: {
          tags: ['Finance'],
          summary: 'Close or reopen an accounting period',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['period', 'action'],
                  properties: { period: { type: 'string' }, action: { type: 'string', enum: ['close', 'reopen'] } },
                },
              },
            },
          },
          responses: { 200: { description: 'Period updated' }, 409: errorResponse },
        },
      },
      '/invoices': {
        get: listOp('Finance', 'List AP/AR invoices with aging', '#/components/schemas/Invoice', [
          { name: 'kind', in: 'query', schema: { type: 'string', enum: ['AP', 'AR'] } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ]),
      },
      '/invoices/{id}': {
        patch: {
          tags: ['Finance'],
          summary: 'Approve an invoice after 3-way match',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Approved' }, 409: errorResponse },
        },
      },
      '/payments': {
        post: {
          tags: ['Finance'],
          summary: 'Record a payment and post the cash journal',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['invoiceId', 'amount', 'method'],
                  properties: {
                    invoiceId: { type: 'string' },
                    amount: { type: 'number', exclusiveMinimum: 0 },
                    method: { type: 'string', enum: ['Bank Transfer', 'UPI', 'Card', 'Cheque'] },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Payment recorded' }, 409: errorResponse },
        },
      },
      '/vendors': { get: listOp('Supply Chain', 'List vendors', '#/components/schemas/Vendor') },
      '/inventory': {
        get: listOp('Supply Chain', 'List inventory with stock health', '#/components/schemas/InventoryItem', [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'lowOnly', in: 'query', schema: { type: 'boolean' } },
        ]),
      },
      '/inventory/{id}': {
        patch: {
          tags: ['Supply Chain'],
          summary: 'Record a stock adjustment',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['qty', 'reason'],
                  properties: { qty: { type: 'integer' }, reason: { type: 'string', minLength: 3 } },
                },
              },
            },
          },
          responses: { 200: { description: 'Adjusted' }, 409: errorResponse },
        },
      },
      '/inventory/reorder': {
        get: { tags: ['Supply Chain'], summary: 'Reorder-point suggestions', responses: { 200: { description: 'Suggestions' } } },
        post: {
          tags: ['Supply Chain'],
          summary: 'Run the reorder engine and raise draft purchase orders',
          responses: { 201: { description: 'Purchase orders created' }, 409: errorResponse },
        },
      },
      '/purchase-orders': {
        get: listOp('Supply Chain', 'List purchase orders', '#/components/schemas/PurchaseOrder', [
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ]),
      },
      '/purchase-orders/{id}': {
        patch: {
          tags: ['Supply Chain'],
          summary: 'Approve a PO or book its goods receipt',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', required: ['action'], properties: { action: { type: 'string', enum: ['approve', 'receive'] } } },
              },
            },
          },
          responses: { 200: { description: 'Updated' }, 409: errorResponse },
        },
      },
      '/projects': { get: listOp('Projects', 'List projects with budget variance', '#/components/schemas/Project') },
      '/projects/{id}/tasks': {
        get: {
          tags: ['Projects'],
          summary: 'Tasks, critical path and resource utilisation',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Tasks' }, 404: errorResponse },
        },
        patch: {
          tags: ['Projects'],
          summary: 'Update a task status or progress',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['taskId'],
                  properties: {
                    taskId: { type: 'string' },
                    status: { type: 'string', enum: ['Todo', 'In Progress', 'Blocked', 'Done'] },
                    progressPct: { type: 'integer', minimum: 0, maximum: 100 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated' }, 422: errorResponse },
        },
      },
      '/forecast': {
        get: {
          tags: ['Forecasting'],
          summary: 'Forecast every tracked SKU',
          parameters: [{ name: 'horizon', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 12, default: 6 } }],
          responses: { 200: { description: 'Portfolio forecast with MAPE' } },
        },
      },
      '/forecast/{sku}': {
        get: {
          tags: ['Forecasting'],
          summary: 'Forecast one SKU with prediction intervals',
          parameters: [
            { name: 'sku', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'horizon', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 12, default: 6 } },
            { name: 'model', in: 'query', schema: { type: 'string', enum: ['Holt-Winters', 'Prophet-style Additive', 'Ensemble'] } },
          ],
          responses: { 200: { description: 'Forecast' }, 404: errorResponse },
        },
      },
      '/analytics/summary': {
        get: { tags: ['Analytics'], summary: 'Executive KPI and chart bundle', responses: { 200: { description: 'Summary' } } },
      },
      '/notifications': {
        get: listOp('Notifications', 'List notifications', '#/components/schemas/Notification', [
          { name: 'unreadOnly', in: 'query', schema: { type: 'boolean' } },
        ]),
        post: {
          tags: ['Notifications'],
          summary: 'Mark notifications read',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { id: { type: 'string' }, all: { type: 'boolean' } } },
              },
            },
          },
          responses: { 200: { description: 'Updated' } },
        },
      },
      '/audit': {
        get: listOp('Audit', 'Read the audit trail', '#/components/schemas/AuditLog', [
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ]),
      },
      '/audit/verify': {
        get: {
          tags: ['Audit'],
          summary: 'Replay the hash chain and report tampering',
          responses: {
            200: {
              description: 'Verification result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      valid: { type: 'boolean' },
                      checked: { type: 'integer' },
                      brokenAtSeq: { type: ['integer', 'null'] },
                      reason: { type: ['string', 'null'] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        sessionCookie: { type: 'apiKey', in: 'cookie', name: 'amdox_session', description: 'HMAC-signed session cookie issued by /auth/login' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: { code: { type: 'string' }, message: { type: 'string' }, details: {} },
            },
          },
        },
        PageMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
            hasMore: { type: 'boolean' },
          },
        },
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            departmentId: { type: 'string' },
            designation: { type: 'string' },
            employmentType: { type: 'string', enum: ['Full-time', 'Part-time', 'Contract', 'Intern'] },
            status: { type: 'string', enum: ['Active', 'On Leave', 'Probation', 'Exited'] },
            ctcAnnual: { type: 'number' },
            joinedOn: { type: 'string', format: 'date' },
          },
        },
        EmployeeInput: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'departmentId', 'designation', 'ctcAnnual'],
          properties: {
            firstName: { type: 'string', minLength: 1 },
            lastName: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            departmentId: { type: 'string' },
            designation: { type: 'string' },
            employmentType: { type: 'string', enum: ['Full-time', 'Part-time', 'Contract', 'Intern'] },
            status: { type: 'string', enum: ['Active', 'On Leave', 'Probation', 'Exited'] },
            location: { type: 'string' },
            ctcAnnual: { type: 'number', minimum: 0 },
            joinedOn: { type: 'string', format: 'date' },
          },
        },
        Department: { type: 'object', properties: { id: { type: 'string' }, code: { type: 'string' }, name: { type: 'string' } } },
        Attendance: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            employeeId: { type: 'string' },
            date: { type: 'string', format: 'date' },
            clockIn: { type: ['string', 'null'] },
            clockOut: { type: ['string', 'null'] },
            workedHours: { type: 'number' },
            status: { type: 'string' },
          },
        },
        LeaveRequest: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            employeeId: { type: 'string' },
            type: { type: 'string', enum: ['Casual', 'Sick', 'Earned', 'Unpaid', 'Maternity'] },
            from: { type: 'string', format: 'date' },
            to: { type: 'string', format: 'date' },
            days: { type: 'integer' },
            status: { type: 'string', enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'] },
          },
        },
        LeaveInput: {
          type: 'object',
          required: ['employeeId', 'type', 'from', 'to', 'reason'],
          properties: {
            employeeId: { type: 'string' },
            type: { type: 'string', enum: ['Casual', 'Sick', 'Earned', 'Unpaid', 'Maternity'] },
            from: { type: 'string', format: 'date' },
            to: { type: 'string', format: 'date' },
            reason: { type: 'string', minLength: 3 },
          },
        },
        PayrollRun: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            period: { type: 'string' },
            status: { type: 'string' },
            employeeCount: { type: 'integer' },
            grossTotal: { type: 'number' },
            netTotal: { type: 'number' },
            durationMs: { type: 'integer' },
          },
        },
        Account: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] },
            normalBalance: { type: 'string', enum: ['debit', 'credit'] },
          },
        },
        JournalLine: {
          type: 'object',
          required: ['accountCode', 'debit', 'credit'],
          properties: {
            accountCode: { type: 'string' },
            debit: { type: 'number', minimum: 0 },
            credit: { type: 'number', minimum: 0 },
            memo: { type: 'string' },
          },
        },
        JournalEntry: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            reference: { type: 'string' },
            date: { type: 'string', format: 'date' },
            period: { type: 'string' },
            memo: { type: 'string' },
            status: { type: 'string', enum: ['Draft', 'Posted', 'Reversed'] },
            lines: { type: 'array', items: { $ref: '#/components/schemas/JournalLine' } },
          },
        },
        JournalInput: {
          type: 'object',
          required: ['date', 'memo', 'lines'],
          properties: {
            date: { type: 'string', format: 'date' },
            memo: { type: 'string', minLength: 3 },
            currency: { type: 'string', enum: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'] },
            lines: { type: 'array', minItems: 2, items: { $ref: '#/components/schemas/JournalLine' } },
          },
        },
        Period: {
          type: 'object',
          properties: { period: { type: 'string' }, status: { type: 'string', enum: ['Open', 'Closed'] } },
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            kind: { type: 'string', enum: ['AP', 'AR'] },
            number: { type: 'string' },
            counterpartyName: { type: 'string' },
            dueDate: { type: 'string', format: 'date' },
            total: { type: 'number' },
            amountPaid: { type: 'number' },
            status: { type: 'string' },
            matchState: { type: 'string' },
          },
        },
        Vendor: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            name: { type: 'string' },
            onTimeDeliveryPct: { type: 'number' },
            rating: { type: 'number' },
          },
        },
        InventoryItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sku: { type: 'string' },
            name: { type: 'string' },
            onHand: { type: 'integer' },
            allocated: { type: 'integer' },
            reorderPoint: { type: 'integer' },
            unitCost: { type: 'number' },
            health: { type: 'string' },
          },
        },
        PurchaseOrder: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            number: { type: 'string' },
            vendorName: { type: 'string' },
            status: { type: 'string' },
            total: { type: 'number' },
            autoGenerated: { type: 'boolean' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string' },
            budget: { type: 'number' },
            actualCost: { type: 'number' },
            progressPct: { type: 'integer' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            event: { type: 'string' },
            title: { type: 'string' },
            severity: { type: 'string', enum: ['info', 'success', 'warning', 'critical'] },
            read: { type: 'boolean' },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            seq: { type: 'integer' },
            at: { type: 'string', format: 'date-time' },
            actorName: { type: 'string' },
            action: { type: 'string' },
            entity: { type: 'string' },
            summary: { type: 'string' },
            prevHash: { type: 'string' },
            hash: { type: 'string' },
          },
        },
      },
    },
    security: [{ sessionCookie: [] }],
  }
}

export type OpenApiDocument = ReturnType<typeof openApiDocument>
