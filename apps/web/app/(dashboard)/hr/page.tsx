"use client"
import { useState, useEffect } from "react"
import { RBACGuard } from "@/components/rbac-guard"
import { SubNav } from "@/components/sub-nav"

const hrNavItems = [
  { label: "Employees", href: "/hr" },
  { label: "Attendance", href: "/hr/attendance" },
  { label: "Leave Mgmt", href: "/hr/leave" },
  { label: "Run Payroll", href: "/hr/payroll" },
  { label: "Org Chart", href: "/hr/org-chart" },
  { label: "Compliance", href: "/hr/compliance" },
  { label: "Payslips", href: "/hr/payslips" },
]

const SUPABASE_URL = "https://qrqdavorzpxwvaxflpbu.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycWRhdm9yenB4d3ZheGZscGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI1MDEwMywiZXhwIjoyMDk2ODI2MTAzfQ.nLPVm1krpeYVBuRVeyz9k6Melyja7AECR3jcH_TFPFQ"
const TENANT_ID = "55ac8fa1-60e1-47f4-8dab-3dfdb3ec1f23"

const MOCK_EMPLOYEES = [
  { id: "1", firstName: "Nishant", lastName: "Dhall", department: "Engineering", designation: "SDE Intern", joiningDate: "2026-04-01", salary: 25000, status: "ACTIVE" },
  { id: "2", firstName: "Priya", lastName: "Sharma", department: "Finance", designation: "Sr. Accountant", joiningDate: "2025-01-15", salary: 65000, status: "ACTIVE" },
  { id: "3", firstName: "Rahul", lastName: "Kumar", department: "Supply Chain", designation: "Manager", joiningDate: "2024-03-10", salary: 80000, status: "ACTIVE" },
  { id: "4", firstName: "Anita", lastName: "Singh", department: "HR", designation: "HR Lead", joiningDate: "2023-06-01", salary: 70000, status: "ON_LEAVE" },
]

export default function HRPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", employeeCode: "",
    department: "Engineering", designation: "", salary: "", joiningDate: new Date().toISOString().split("T")[0]
  })

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/employees?select=*,user:users(*)&tenantId=eq.${TENANT_ID}`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      )
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setEmployees(data)
      } else {
        setEmployees(MOCK_EMPLOYEES)
      }
    } catch { setEmployees(MOCK_EMPLOYEES) }
    setLoading(false)
  }

  useEffect(() => { fetchEmployees() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Create user first
      const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ tenantId: TENANT_ID, email: form.email, firstName: form.firstName, lastName: form.lastName, role: "EMPLOYEE", status: "ACTIVE" })
      })
      const user = await userRes.json()
      const userId = Array.isArray(user) ? user[0]?.id : user?.id

      if (userId) {
        await fetch(`${SUPABASE_URL}/rest/v1/employees`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({ tenantId: TENANT_ID, userId, employeeCode: form.employeeCode, designation: form.designation, salary: Number(form.salary), joiningDate: form.joiningDate, status: "ACTIVE" })
        })
      }
      setSuccess("Employee added successfully!")
      setShowForm(false)
      setForm({ firstName: "", lastName: "", email: "", employeeCode: "", department: "Engineering", designation: "", salary: "", joiningDate: new Date().toISOString().split("T")[0] })
      fetchEmployees()
    } catch {
      // Demo mode
      setEmployees(prev => [...prev, { id: Date.now(), ...form, status: "ACTIVE" }])
      setSuccess("Employee added! (Demo mode)")
      setShowForm(false)
    }
    setSaving(false)
    setTimeout(() => setSuccess(""), 3000)
  }

  return (
    <RBACGuard module="hr">
      <div className="flex gap-6">
        <div className="w-56 shrink-0">
          <SubNav title="HR & PAYROLL" items={hrNavItems} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Employees — {employees.length} Active</h2>
            <div className="flex gap-2">
              <input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                {showForm ? "Cancel" : "+ Onboard"}
              </button>
            </div>
          </div>

          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

          {showForm && (
            <div className="bg-white rounded-xl border p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Onboard New Employee</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                {[
                  ["firstName", "First Name", "text"],
                  ["lastName", "Last Name", "text"],
                  ["email", "Work Email", "email"],
                  ["employeeCode", "Employee Code (e.g. EMP002)", "text"],
                  ["designation", "Designation", "text"],
                  ["salary", "Monthly Salary (₹)", "number"],
                ].map(([key, label, type]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input type={type} value={(form as any)[key]} required
                      onChange={e => setForm({...form, [key]: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Department</label>
                  <select value={form.department} onChange={e => setForm({...form, department: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {["Engineering","Finance","HR","Supply Chain","Marketing","Operations"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Joining Date</label>
                  <input type="date" value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <button type="submit" disabled={saving}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                    {saving ? "Saving..." : "Add Employee"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl border">
            <div className="p-5 border-b"><h3 className="font-semibold text-gray-900">Employee Directory</h3></div>
            {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b bg-gray-50">
                    <th className="text-left px-5 py-3">Name</th>
                    <th className="text-left px-5 py-3">Department</th>
                    <th className="text-left px-5 py-3">Role</th>
                    <th className="text-left px-5 py-3">Join Date</th>
                    <th className="text-left px-5 py-3">Salary</th>
                    <th className="text-left px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.filter(emp => {
                    const name = `${emp.user?.firstName||emp.firstName||""} ${emp.user?.lastName||emp.lastName||""}`.toLowerCase()
                    const dept = (emp.department||"").toLowerCase()
                    const desig = (emp.designation||"").toLowerCase()
                    return !search || name.includes(search.toLowerCase()) || dept.includes(search.toLowerCase()) || desig.includes(search.toLowerCase())
                  }).map((emp, i) => (
                    <tr key={emp.id || i} className="border-b hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">
                        {emp.user?.firstName || emp.firstName} {emp.user?.lastName || emp.lastName}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{emp.department || emp.user?.department || "—"}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{emp.designation || "—"}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN", {month:"short", year:"numeric"}) : "—"}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{emp.salary ? `₹${Number(emp.salary).toLocaleString("en-IN")}/mo` : "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          emp.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                          emp.status === "ON_LEAVE" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>{emp.status === "ON_LEAVE" ? "On Leave" : emp.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </RBACGuard>
  )
}
