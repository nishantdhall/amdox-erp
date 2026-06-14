"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token) {
      router.push('/login')
      return
    }
    
    if (userData) setUser(JSON.parse(userData))
    
    Promise.all([
      api.getEmployees(token),
      api.getDepartments(token)
    ]).then(([empData, deptData]) => {
      setEmployees(empData.data || [])
      setDepartments(deptData.data || [])
      setLoading(false)
    })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400">AMDOX ERP</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">{user?.email}</span>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
            Logout
          </button>
        </div>
      </nav>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Employees</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{employees.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Departments</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{departments.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">System Status</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">Active</p>
          </div>
        </div>

        {/* Departments Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 mb-6">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Departments</h2>
          </div>
          <div className="p-6">
            {departments.length === 0 ? (
              <p className="text-gray-400">No departments yet</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left pb-3">Name</th>
                    <th className="text-left pb-3">Code</th>
                    <th className="text-left pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept: any) => (
                    <tr key={dept.id} className="border-b border-gray-700/50">
                      <td className="py-3">{dept.name}</td>
                      <td className="py-3 text-gray-400">{dept.code}</td>
                      <td className="py-3"><span className="bg-green-900/50 text-green-400 px-2 py-1 rounded text-xs">{dept.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Employees</h2>
          </div>
          <div className="p-6">
            {employees.length === 0 ? (
              <p className="text-gray-400">No employees yet</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left pb-3">Name</th>
                    <th className="text-left pb-3">Code</th>
                    <th className="text-left pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp: any) => (
                    <tr key={emp.id} className="border-b border-gray-700/50">
                      <td className="py-3">{emp.user?.firstName} {emp.user?.lastName}</td>
                      <td className="py-3 text-gray-400">{emp.employeeCode}</td>
                      <td className="py-3"><span className="bg-blue-900/50 text-blue-400 px-2 py-1 rounded text-xs">{emp.status}</span></td>
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
