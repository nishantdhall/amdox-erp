"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = 'http://localhost:3001/api/v1'

export default function AttendancePage() {
  const router = useRouter()
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    employeeId: '',
    attendanceDate: new Date().toISOString().split('T')[0],
    clockIn: '',
    clockOut: '',
    status: 'PRESENT'
  })

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [attRes, empRes] = await Promise.all([
      fetch(`${API_URL}/attendance`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    const attData = await attRes.json()
    const empData = await empRes.json()
    setRecords(attData.data || [])
    setEmployees(empData.data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (data.success) {
      setSuccess('Attendance marked!')
      setShowForm(false)
      setForm({ employeeId: '', attendanceDate: new Date().toISOString().split('T')[0], clockIn: '', clockOut: '', status: 'PRESENT' })
      fetchData()
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(data.error || 'Failed to mark attendance')
    }
  }

  const statusColors: any = {
    PRESENT: 'bg-green-900/50 text-green-400',
    ABSENT: 'bg-red-900/50 text-red-400',
    LATE: 'bg-yellow-900/50 text-yellow-400',
    HALF_DAY: 'bg-blue-900/50 text-blue-400'
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
          <a href="/attendance" className="text-blue-400 text-sm font-semibold">Attendance</a>
          <a href="/leave" className="text-gray-300 hover:text-white text-sm">Leave</a>
          <a href="/payroll" className="text-gray-300 hover:text-white text-sm">Payroll</a>
        </div>
      </nav>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Attendance ({records.length})</h2>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
            {showForm ? 'Cancel' : '+ Mark Attendance'}
          </button>
        </div>

        {success && <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4">{success}</div>}
        {error && <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}

        {showForm && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Mark Attendance</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Employee</label>
                <select value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select Employee</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.user?.firstName} {emp.user?.lastName} — {emp.employeeCode}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date</label>
                <input type="date" value={form.attendanceDate}
                  onChange={e => setForm({...form, attendanceDate: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Clock In</label>
                <input type="time" value={form.clockIn}
                  onChange={e => setForm({...form, clockIn: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Clock Out</label>
                <input type="time" value={form.clockOut}
                  onChange={e => setForm({...form, clockOut: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="HALF_DAY">Half Day</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg">
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-6">
            {records.length === 0 ? (
              <p className="text-gray-400">No attendance records yet.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left pb-3">Employee</th>
                    <th className="text-left pb-3">Date</th>
                    <th className="text-left pb-3">Clock In</th>
                    <th className="text-left pb-3">Clock Out</th>
                    <th className="text-left pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec: any) => (
                    <tr key={rec.id} className="border-b border-gray-700/50">
                      <td className="py-3">{rec.employee?.user?.firstName} {rec.employee?.user?.lastName}</td>
                      <td className="py-3 text-gray-400">{new Date(rec.attendanceDate).toLocaleDateString()}</td>
                      <td className="py-3 text-gray-400">{rec.clockIn ? new Date(rec.clockIn).toLocaleTimeString() : '-'}</td>
                      <td className="py-3 text-gray-400">{rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString() : '-'}</td>
                      <td className="py-3"><span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[rec.status]}`}>{rec.status}</span></td>
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
