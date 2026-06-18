"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = 'http://localhost:3001/api/v1'

export default function PayrollPage() {
  const router = useRouter()
  const [payrolls, setPayrolls] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    employeeId: '',
    payrollMonth: new Date().toISOString().slice(0, 7),
    basicSalary: '',
    allowances: '0',
    deductions: '0'
  })

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [payRes, empRes] = await Promise.all([
      fetch(`${API_URL}/payroll`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    const payData = await payRes.json()
    const empData = await empRes.json()
    setPayrolls(payData.data || [])
    setEmployees(empData.data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch(`${API_URL}/payroll/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...form,
        basicSalary: Number(form.basicSalary),
        allowances: Number(form.allowances),
        deductions: Number(form.deductions)
      })
    })
    const data = await res.json()
    if (data.success) {
      setSuccess('Payroll generated successfully!')
      setShowForm(false)
      setForm({ employeeId: '', payrollMonth: new Date().toISOString().slice(0, 7), basicSalary: '', allowances: '0', deductions: '0' })
      fetchData()
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(data.error || 'Failed to generate payroll')
    }
  }

  const totalPayroll = payrolls.reduce((sum: number, p: any) => sum + Number(p.netSalary), 0)

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
          <a href="/leave" className="text-gray-300 hover:text-white text-sm">Leave</a>
          <a href="/payroll" className="text-blue-400 text-sm font-semibold">Payroll</a>
        </div>
      </nav>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Payroll Management</h2>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
            {showForm ? 'Cancel' : '▶ Generate Payroll'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Records</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{payrolls.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Payout</p>
            <p className="text-3xl font-bold text-green-400 mt-2">₹{totalPayroll.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Current Month</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {success && <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4">{success}</div>}
        {error && <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}

        {showForm && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Generate Payroll</h3>
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
                <label className="block text-sm text-gray-400 mb-1">Payroll Month</label>
                <input type="month" value={form.payrollMonth}
                  onChange={e => setForm({...form, payrollMonth: e.target.value})} required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Basic Salary (₹)</label>
                <input type="number" value={form.basicSalary}
                  onChange={e => setForm({...form, basicSalary: e.target.value})} required
                  placeholder="25000"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Allowances (₹)</label>
                <input type="number" value={form.allowances}
                  onChange={e => setForm({...form, allowances: e.target.value})}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Deductions (₹)</label>
                <input type="number" value={form.deductions}
                  onChange={e => setForm({...form, deductions: e.target.value})}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-end">
                <div className="bg-gray-700 rounded-lg p-3 w-full">
                  <p className="text-xs text-gray-400">Net Salary (estimated)</p>
                  <p className="text-lg font-bold text-green-400">
                    ₹{form.basicSalary ? (Number(form.basicSalary) + Number(form.allowances) - Number(form.deductions) - (Number(form.basicSalary) * 0.1)).toLocaleString() : '0'}
                  </p>
                  <p className="text-xs text-gray-500">After 10% tax deduction</p>
                </div>
              </div>
              <div className="col-span-2">
                <button type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg">
                  Generate Payroll
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-6">
            {payrolls.length === 0 ? (
              <p className="text-gray-400">No payroll records yet.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left pb-3">Employee</th>
                    <th className="text-left pb-3">Month</th>
                    <th className="text-left pb-3">Basic</th>
                    <th className="text-left pb-3">Allowances</th>
                    <th className="text-left pb-3">Deductions</th>
                    <th className="text-left pb-3">Tax</th>
                    <th className="text-left pb-3">Net Salary</th>
                    <th className="text-left pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-700/50">
                      <td className="py-3">{p.employee?.user?.firstName} {p.employee?.user?.lastName}</td>
                      <td className="py-3 text-gray-400">{p.payrollMonth}</td>
                      <td className="py-3 text-gray-400">₹{Number(p.basicSalary).toLocaleString()}</td>
                      <td className="py-3 text-green-400">+₹{Number(p.allowances).toLocaleString()}</td>
                      <td className="py-3 text-red-400">-₹{Number(p.deductions).toLocaleString()}</td>
                      <td className="py-3 text-red-400">-₹{Number(p.taxAmount).toLocaleString()}</td>
                      <td className="py-3 font-bold text-green-400">₹{Number(p.netSalary).toLocaleString()}</td>
                      <td className="py-3"><span className="bg-blue-900/50 text-blue-400 px-2 py-1 rounded text-xs">{p.status}</span></td>
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
