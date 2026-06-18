"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = 'http://localhost:3001/api/v1'

export default function LeavePage() {
  const router = useRouter()
  const [leaves, setLeaves] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    employeeId: '',
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: ''
  })

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [leaveRes, empRes] = await Promise.all([
      fetch(`${API_URL}/leave`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    const leaveData = await leaveRes.json()
    const empData = await empRes.json()
    setLeaves(leaveData.data || [])
    setEmployees(empData.data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch(`${API_URL}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (data.success) {
      setSuccess('Leave applied successfully!')
      setShowForm(false)
      setForm({ employeeId: '', leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' })
      fetchData()
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(data.error || 'Failed to apply leave')
    }
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    const res = await fetch(`${API_URL}/leave/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, approvedBy: 'Manager' })
    })
    const data = await res.json()
    if (data.success) {
      setSuccess(`Leave ${status.toLowerCase()}!`)
      fetchData()
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const statusColors: any = {
    PENDING: 'bg-yellow-900/50 text-yellow-400',
    APPROVED: 'bg-green-900/50 text-green-400',
    REJECTED: 'bg-red-900/50 text-red-400'
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400">AMDOX ERP</h1>
        <div className="flex gap-6">
          <a href="/dashboard" className="text-gray-300 hover:text-white text-sm">Dashboard</a>
          <a href="/employees" className="text-gray-300 hover:text-white text-sm">Employees</a>
          <a href="/attendance" className="text-gray-300 hover:text-white text-sm">Attendance</a>
          <a href="/leave" className="text-blue-400 text-sm font-semibold">Leave</a>
          <a href="/payroll" className="text-gray-300 hover:text-white text-sm">Payroll</a>
        </div>
      </nav>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Leave Management ({leaves.length})</h2>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
            {showForm ? 'Cancel' : '+ Apply Leave'}
          </button>
        </div>

        {success && <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4">{success}</div>}
        {error && <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}

        {showForm && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Apply Leave</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Employee</label>
                <select value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select Employee</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.user?.firstName} {emp.user?.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Leave Type</label>
                <select value={form.leaveType} onChange={e => setForm({...form, leaveType: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Reason</label>
                <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                  rows={3} placeholder="Reason for leave..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <button type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg">
                  Submit Leave
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-6">
            {leaves.length === 0 ? (
              <p className="text-gray-400">No leave requests yet.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left pb-3">Employee</th>
                    <th className="text-left pb-3">Type</th>
                    <th className="text-left pb-3">From</th>
                    <th className="text-left pb-3">To</th>
                    <th className="text-left pb-3">Reason</th>
                    <th className="text-left pb-3">Status</th>
                    <th className="text-left pb-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave: any) => (
                    <tr key={leave.id} className="border-b border-gray-700/50">
                      <td className="py-3">{leave.employee?.user?.firstName} {leave.employee?.user?.lastName}</td>
                      <td className="py-3 text-gray-400">{leave.leaveType}</td>
                      <td className="py-3 text-gray-400">{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td className="py-3 text-gray-400">{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td className="py-3 text-gray-400 max-w-xs truncate">{leave.reason || '-'}</td>
                      <td className="py-3"><span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[leave.status]}`}>{leave.status}</span></td>
                      <td className="py-3">
                        {leave.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded">
                              Approve
                            </button>
                            <button onClick={() => handleStatusUpdate(leave.id, 'REJECTED')}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded">
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
