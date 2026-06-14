"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = 'http://localhost:3001/api/v1'

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    employeeCode: '', designation: '', phone: '',
    salary: '', departmentId: ''
  })

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    const [empRes, deptRes] = await Promise.all([
      fetch(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/departments`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    const empData = await empRes.json()
    const deptData = await deptRes.json()
    setEmployees(empData.data || [])
    setDepartments(deptData.data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch(`${API_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, salary: Number(form.salary) })
    })
    const data = await res.json()
    if (data.success) {
      setSuccess('Employee added!')
      setShowForm(false)
      setForm({ firstName: '', lastName: '', email: '', employeeCode: '', designation: '', phone: '', salary: '', departmentId: '' })
      fetchData()
    }
    setSubmitting(false)
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400">AMDOX ERP</h1>
        <div className="flex gap-4">
          <a href="/dashboard" className="text-gray-300 hover:text-white text-sm">Dashboard</a>
          <a href="/employees" className="text-blue-400 text-sm font-semibold">Employees</a>
        </div>
      </nav>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Employees ({employees.length})</h2>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
            {showForm ? 'Cancel' : '+ Add Employee'}
          </button>
        </div>

        {success && <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4">{success}</div>}

        {showForm && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">New Employee</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {[
                ['firstName', 'First Name'],
                ['lastName', 'Last Name'],
                ['email', 'Email'],
                ['employeeCode', 'Employee Code'],
                ['designation', 'Designation'],
                ['phone', 'Phone'],
                ['salary', 'Salary']
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm text-gray-400 mb-1">{label}</label>
                  <input
                    type={key === 'email' ? 'email' : key === 'salary' ? 'number' : 'text'}
                    value={(form as any)[key]}
                    onChange={e => setForm({...form, [key]: e.target.value})}
                    required={['firstName','lastName','email','employeeCode'].includes(key)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Department</label>
                <select value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select Department</option>
                  {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <button type="submit" disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-semibold py-2 px-6 rounded-lg">
                  {submitting ? 'Saving...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-6">
            {employees.length === 0 ? (
              <p className="text-gray-400">No employees yet — add one above!</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left pb-3">Name</th>
                    <th className="text-left pb-3">Code</th>
                    <th className="text-left pb-3">Designation</th>
                    <th className="text-left pb-3">Department</th>
                    <th className="text-left pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp: any) => (
                    <tr key={emp.id} className="border-b border-gray-700/50">
                      <td className="py-3">{emp.user?.firstName} {emp.user?.lastName}</td>
                      <td className="py-3 text-gray-400">{emp.employeeCode}</td>
                      <td className="py-3 text-gray-400">{emp.designation || '-'}</td>
                      <td className="py-3 text-gray-400">{emp.department?.name || '-'}</td>
                      <td className="py-3"><span className="bg-green-900/50 text-green-400 px-2 py-1 rounded text-xs">{emp.status}</span></td>
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
