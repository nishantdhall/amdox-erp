"use client"
import { useState } from "react"
import { RBACGuard } from "@/components/rbac-guard"
import { SubNav } from "@/components/sub-nav"

const scNavItems = [
  { label: "Purchase Orders", href: "/supply-chain/purchase-orders" },
  { label: "Inventory", href: "/supply-chain" },
  { label: "Vendors", href: "/supply-chain/vendors" },
  { label: "Goods Receipt", href: "/supply-chain/goods-receipt" },
  { label: "Reorder Rules", href: "/supply-chain/reorder-rules" },
  { label: "Vendor Portal", href: "/supply-chain/vendor-portal" },
]

const INITIAL_STOCK = [
  { id: "SKU-441", product: "Laptop Stand Pro", inStock: 8, reorderAt: 50, status: "LOW" },
  { id: "SKU-228", product: "USB-C Hub 7-Port", inStock: 142, reorderAt: 30, status: "OK" },
  { id: "SKU-119", product: "Wireless Mouse", inStock: 31, reorderAt: 40, status: "WATCH" },
  { id: "SKU-088", product: "Desk Organizer Set", inStock: 215, reorderAt: 25, status: "OK" },
  { id: "SKU-312", product: "Monitor Arm Dual", inStock: 5, reorderAt: 20, status: "LOW" },
]

export default function SupplyChainPage() {
  const [items, setItems] = useState(INITIAL_STOCK)
  const [showForm, setShowForm] = useState(false)
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({ id: "", product: "", inStock: "", reorderAt: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const inStock = Number(form.inStock)
    const reorderAt = Number(form.reorderAt)
    const status = inStock <= reorderAt * 0.3 ? "LOW" : inStock <= reorderAt ? "WATCH" : "OK"
    setItems(prev => [...prev, { id: form.id, product: form.product, inStock, reorderAt, status }])
    setSuccess(`SKU ${form.id} added successfully!`)
    setShowForm(false)
    setForm({ id: "", product: "", inStock: "", reorderAt: "" })
    setTimeout(() => setSuccess(""), 3000)
  }

  const totalSKUs = items.length * 247
  const lowStock = items.filter(i => i.status === "LOW").length

  return (
    <RBACGuard module="supply-chain">
      <div className="flex gap-6">
        <div className="w-56 shrink-0">
          <SubNav title="SUPPLY CHAIN" items={scNavItems} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Inventory — Real-Time Stock Levels</h2>
            <button onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              {showForm ? "Cancel" : "+ Add SKU"}
            </button>
          </div>

          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500 mb-1">TOTAL SKUs</p>
              <p className="text-3xl font-bold text-gray-900">{totalSKUs.toLocaleString()}</p>
              <p className="text-xs text-blue-500 mt-1">Across 4 warehouses</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500 mb-1">LOW STOCK ALERTS</p>
              <p className="text-3xl font-bold text-orange-500">{lowStock}</p>
              <p className="text-xs text-red-500 mt-1">Immediate action needed</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500 mb-1">AUTO POs TODAY</p>
              <p className="text-3xl font-bold text-green-500">3</p>
              <p className="text-xs text-green-500 mt-1">Generated automatically</p>
            </div>
          </div>

          {showForm && (
            <div className="bg-white rounded-xl border p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Add New SKU</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                {[["id","SKU Code (e.g. SKU-999)"],["product","Product Name"],["inStock","Current Stock (units)"],["reorderAt","Reorder Level (units)"]].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input type={key.includes("Stock") || key.includes("At") ? "number" : "text"}
                      value={(form as any)[key]} required
                      onChange={e => setForm({...form, [key]: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
                <div className="col-span-2">
                  <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
                    Add SKU
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl border">
            <div className="p-5 border-b"><h3 className="font-semibold text-gray-900">Stock Levels</h3></div>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b bg-gray-50">
                  <th className="text-left px-5 py-3">SKU</th>
                  <th className="text-left px-5 py-3">Product</th>
                  <th className="text-left px-5 py-3">In Stock</th>
                  <th className="text-left px-5 py-3">Reorder At</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium">{item.id}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{item.product}</td>
                    <td className={`px-5 py-3 text-sm font-semibold ${item.status === "LOW" ? "text-red-500" : item.status === "WATCH" ? "text-orange-500" : "text-gray-900"}`}>{item.inStock} units</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{item.reorderAt} units</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        item.status === "LOW" ? "bg-red-100 text-red-700" :
                        item.status === "WATCH" ? "bg-orange-100 text-orange-700" :
                        "bg-green-100 text-green-700"
                      }`}>⚠ {item.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      {item.status !== "OK" ? (
                        <button onClick={() => { alert(`PO created for ${item.product}!\nQty: ${item.reorderAt * 2} units\nVendor will be notified.`) }}
                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Create PO</button>
                      ) : (
                        <button onClick={() => { alert(`SKU: ${item.id}\nProduct: ${item.product}\nIn Stock: ${item.inStock} units\nReorder At: ${item.reorderAt} units\nStatus: ${item.status}`) }}
                        className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">View</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 bg-amber-50 border-t text-xs text-amber-700">
              <strong>Auto-reorder:</strong> When stock ≤ threshold → System drafts PO → Vendor email sent → Finance 3-way match (PO ↔ GR ↔ Invoice) → GL entry auto-posted.
            </div>
          </div>
        </div>
      </div>
    </RBACGuard>
  )
}
