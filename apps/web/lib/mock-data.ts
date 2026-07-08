// ============================================
// AMDOX ERP — Mock Data for All Modules
// ============================================

// Dashboard KPIs
export const dashboardKpis = [
  { icon: '💰', label: 'Revenue (MTD)', value: '₹4.2Cr', change: '↑ 12% vs last month', changeColor: '#22a06b' },
  { icon: '👥', label: 'Active Employees', value: '248', change: '↑ 5 new this month', changeColor: '#22a06b' },
  { icon: '📦', label: 'Open POs', value: '34', change: '8 need approval', changeColor: '#e6820a' },
  { icon: '🤖', label: 'AI Accuracy', value: '91.4%', change: 'MAPE: 8.6% ✓', changeColor: '#22a06b' },
]

// Dashboard Alerts
export const dashboardAlerts = [
  { type: 'danger' as const, label: 'LOW STOCK', message: 'SKU-441 below reorder level' },
  { type: 'warning' as const, label: 'APPROVAL', message: 'PO #2891 awaiting your OK' },
  { type: 'success' as const, label: 'DONE', message: 'June payroll processed ✓' },
  { type: 'info' as const, label: 'REPORT', message: 'Q2 Finance report ready' },
]

// Revenue Chart Data
export const revenueChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  values: [280, 360, 320, 480, 420, 540],
}

// Finance — Journal Entries
export const journalEntries = [
  { date: '01 Jun', account: 'Cash A/c', description: 'Client payment received', debit: '2,40,000', credit: '—', status: 'Posted' as const },
  { date: '03 Jun', account: 'Rent Exp.', description: 'Office rent payment', debit: '—', credit: '85,000', status: 'Posted' as const },
  { date: '05 Jun', account: 'Revenue', description: 'Invoice INV-2041', debit: '4,20,000', credit: '—', status: 'Pending' as const },
  { date: '08 Jun', account: 'Payroll', description: 'May salary disbursement', debit: '—', credit: '18,60,000', status: 'Posted' as const },
  { date: '10 Jun', account: 'Inventory', description: 'Stock purchase PO-2891', debit: '6,50,000', credit: '—', status: 'On Hold' as const },
]

// Finance — Accounts Payable
export const accountsPayable = [
  { id: 'AP-001', vendor: 'TechParts India', invoiceNo: 'VND-8841', amount: '₹6,50,000', dueDate: '15 Jul 2026', status: 'Pending' as const, matched: true },
  { id: 'AP-002', vendor: 'OfficeHub Delhi', invoiceNo: 'VND-8842', amount: '₹1,20,000', dueDate: '20 Jun 2026', status: 'Paid' as const, matched: true },
  { id: 'AP-003', vendor: 'CloudServe Inc.', invoiceNo: 'VND-8843', amount: '₹45,000', dueDate: '25 Jun 2026', status: 'Overdue' as const, matched: false },
  { id: 'AP-004', vendor: 'Stationery World', invoiceNo: 'VND-8844', amount: '₹12,500', dueDate: '30 Jun 2026', status: 'Pending' as const, matched: true },
]

// Finance — Accounts Receivable
export const accountsReceivable = [
  { id: 'AR-001', customer: 'Infosys Ltd.', invoiceNo: 'INV-2041', amount: '₹4,20,000', dueDate: '30 Jun 2026', status: 'Pending' as const, aging: '15 days' },
  { id: 'AR-002', customer: 'TCS Solutions', invoiceNo: 'INV-2040', amount: '₹8,50,000', dueDate: '15 Jun 2026', status: 'Paid' as const, aging: '—' },
  { id: 'AR-003', customer: 'Wipro Digital', invoiceNo: 'INV-2039', amount: '₹2,30,000', dueDate: '10 Jun 2026', status: 'Overdue' as const, aging: '27 days' },
  { id: 'AR-004', customer: 'HCL Technologies', invoiceNo: 'INV-2038', amount: '₹5,60,000', dueDate: '05 Jul 2026', status: 'Pending' as const, aging: '2 days' },
]

// HR — Employees
export const employees = [
  { name: 'Nishant Dhall', department: 'Engineering', role: 'SDE Intern', joinDate: 'Apr 2026', salary: '₹25,000/mo', status: 'Active' as const },
  { name: 'Priya Sharma', department: 'Finance', role: 'Sr. Accountant', joinDate: 'Jan 2025', salary: '₹65,000/mo', status: 'Active' as const },
  { name: 'Rahul Kumar', department: 'Supply Chain', role: 'Manager', joinDate: 'Mar 2024', salary: '₹80,000/mo', status: 'Active' as const },
  { name: 'Anita Singh', department: 'HR', role: 'HR Lead', joinDate: 'Jun 2023', salary: '₹70,000/mo', status: 'On Leave' as const },
  { name: 'Vikram Patel', department: 'Engineering', role: 'Tech Lead', joinDate: 'Sep 2022', salary: '₹1,20,000/mo', status: 'Active' as const },
  { name: 'Sneha Gupta', department: 'Marketing', role: 'Marketing Head', joinDate: 'Feb 2024', salary: '₹90,000/mo', status: 'Active' as const },
  { name: 'Arjun Reddy', department: 'Operations', role: 'Ops Manager', joinDate: 'Jul 2023', salary: '₹75,000/mo', status: 'Active' as const },
  { name: 'Meera Joshi', department: 'Finance', role: 'Jr. Accountant', joinDate: 'Dec 2025', salary: '₹35,000/mo', status: 'Active' as const },
]

// HR — Payroll Records
export const payrollRecords = [
  { employee: 'Nishant Dhall', month: 'Jun 2026', basic: '₹25,000', allowances: '₹5,000', deductions: '₹2,000', tax: '₹2,500', net: '₹25,500', status: 'Processed' as const },
  { employee: 'Priya Sharma', month: 'Jun 2026', basic: '₹65,000', allowances: '₹12,000', deductions: '₹5,000', tax: '₹6,500', net: '₹65,500', status: 'Processed' as const },
  { employee: 'Rahul Kumar', month: 'Jun 2026', basic: '₹80,000', allowances: '₹15,000', deductions: '₹8,000', tax: '₹8,000', net: '₹79,000', status: 'Processed' as const },
  { employee: 'Vikram Patel', month: 'Jun 2026', basic: '₹1,20,000', allowances: '₹20,000', deductions: '₹10,000', tax: '₹12,000', net: '₹1,18,000', status: 'Pending' as const },
  { employee: 'Sneha Gupta', month: 'Jun 2026', basic: '₹90,000', allowances: '₹15,000', deductions: '₹7,000', tax: '₹9,000', net: '₹89,000', status: 'Pending' as const },
]

// Supply Chain — Inventory
export const inventoryItems = [
  { sku: 'SKU-441', product: 'Laptop Stand Pro', inStock: 8, reorderAt: 50, status: 'LOW' as const },
  { sku: 'SKU-228', product: 'USB-C Hub 7-Port', inStock: 142, reorderAt: 30, status: 'OK' as const },
  { sku: 'SKU-119', product: 'Wireless Mouse', inStock: 31, reorderAt: 40, status: 'WATCH' as const },
  { sku: 'SKU-088', product: 'Desk Organizer Set', inStock: 215, reorderAt: 25, status: 'OK' as const },
  { sku: 'SKU-312', product: 'Monitor Arm Dual', inStock: 5, reorderAt: 20, status: 'LOW' as const },
  { sku: 'SKU-567', product: 'Keyboard Mechanical', inStock: 89, reorderAt: 30, status: 'OK' as const },
]

// Supply Chain — Purchase Orders
export const purchaseOrders = [
  { poNumber: 'PO-2891', supplier: 'TechParts India', date: '10 Jun 2026', total: '₹6,50,000', status: 'Approved' as const },
  { poNumber: 'PO-2890', supplier: 'OfficeHub Delhi', date: '08 Jun 2026', total: '₹1,20,000', status: 'Received' as const },
  { poNumber: 'PO-2889', supplier: 'Digital World', date: '05 Jun 2026', total: '₹3,45,000', status: 'Draft' as const },
  { poNumber: 'PO-2888', supplier: 'MegaSupply Co.', date: '01 Jun 2026', total: '₹8,90,000', status: 'Received' as const },
  { poNumber: 'PO-2887', supplier: 'TechParts India', date: '28 May 2026', total: '₹2,15,000', status: 'Cancelled' as const },
]

// AI Forecasting — KPIs
export const forecastKpis = [
  { icon: '📉', label: 'MAPE (Error Rate)', value: '8.6%', change: 'Target <12% ✓ Achieved', changeColor: '#22a06b' },
  { icon: '📅', label: 'Forecast Horizon', value: '90 days', change: 'Next retrain: Sunday', changeColor: '#8898aa' },
  { icon: '📈', label: 'Predicted Peak', value: 'Wk3 Aug', change: '+34% above avg', changeColor: '#e6820a' },
  { icon: '📦', label: 'Suggested Order', value: '240 units', change: 'Based on forecast', changeColor: '#4f6ef7' },
]

// AI Forecasting — Chart Data
export const forecastChartData = {
  historicalLabels: ['Mar', 'Apr', 'May', 'Jun'],
  historicalValues: [42, 56, 38, 44],
  predictedLabels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  predictedValues: [35, 50, 68, 78, 72, 58],
}

// Settings — Organization
export const orgSettings = {
  name: 'Amdox Technologies Pvt. Ltd.',
  industry: 'Information Technology',
  address: '123 Tech Park, Sector 62, Noida, UP 201301',
  phone: '+91 120-456-7890',
  email: 'contact@amdox.com',
  taxId: '07AABCT1234D1ZA',
  gstNumber: '07AABCT1234D1Z5',
  currency: 'INR (₹)',
  financialYearStart: 'April',
}
