// ============================================
// AMDOX ERP — API Client for NestJS Backend
// ============================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  statusCode: number
}

class ApiClient {
  private token: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('amdox_token')
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('amdox_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('amdox_token')
      localStorage.removeItem('amdox_user')
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    return res.json()
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })
    return res.json()
  }

  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    return res.json()
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    return res.json()
  }

  // ——— Auth ———
  async login(email: string, password: string) {
    return this.post<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', { email, password })
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    return this.post('/auth/register', data)
  }

  async refreshToken(refreshToken: string) {
    return this.post<{ accessToken: string }>('/auth/refresh', { refreshToken })
  }

  async getProfile() {
    return this.get<any>('/auth/me')
  }

  // ——— Employees ———
  async getEmployees() {
    return this.get<any[]>('/employees')
  }

  async getEmployee(id: string) {
    return this.get<any>(`/employees/${id}`)
  }

  async createEmployee(data: any) {
    return this.post('/employees', data)
  }

  async updateEmployee(id: string, data: any) {
    return this.patch(`/employees/${id}`, data)
  }

  async deleteEmployee(id: string) {
    return this.delete(`/employees/${id}`)
  }

  // ——— Departments ———
  async getDepartments() {
    return this.get<any[]>('/departments')
  }

  async createDepartment(data: any) {
    return this.post('/departments', data)
  }

  // ——— Attendance ———
  async getAttendance(params?: { date?: string; employeeId?: string }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : ''
    return this.get<any[]>(`/attendance${query}`)
  }

  async markAttendance(data: any) {
    return this.post('/attendance', data)
  }

  // ——— Leave ———
  async getLeaveRequests() {
    return this.get<any[]>('/leave')
  }

  async createLeaveRequest(data: any) {
    return this.post('/leave', data)
  }

  async updateLeaveStatus(id: string, data: { status: string }) {
    return this.patch(`/leave/${id}`, data)
  }

  // ——— Payroll ———
  async getPayroll(params?: { month?: string }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : ''
    return this.get<any[]>(`/payroll${query}`)
  }

  async generatePayroll(data: { month: string; year: number }) {
    return this.post('/payroll/generate', data)
  }

  // ——— Health ———
  async healthCheck() {
    return this.get<{ status: string }>('/health')
  }
}

export const api = new ApiClient()
