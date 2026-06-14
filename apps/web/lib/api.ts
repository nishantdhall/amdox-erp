const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export const api = {
  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    return res.json()
  },

  async getEmployees(token: string) {
    const res = await fetch(`${API_URL}/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },

  async getDepartments(token: string) {
    const res = await fetch(`${API_URL}/departments`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  }
}
