"use client"

import { useRef, useState, useMemo } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { FileText, Download, Printer, Filter, X } from "lucide-react"
import { useStore } from "../lib/store"
import { formatCurrency, formatDate, calculateTransactionTotal } from "../lib/calculations"

export default function CustomerReportGenerator({ customerId, customerName }) {
  const { customers, getCustomerTransactions } = useStore()
  const customerTransactions = getCustomerTransactions(customerId)
  const reportRef = useRef(null)
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  // Safety check
  const safeCustomers = customers || []
  const customer = safeCustomers.find((c) => c.id === customerId)
  
  // Apply filters to customer transactions
  const filteredTransactions = useMemo(() => {
    let filtered = customerTransactions
      .filter((t) => {
        if (!t || !t.date) return false
        
        // Date range filter
        if (dateRange.start && new Date(t.date) < new Date(dateRange.start)) return false
        if (dateRange.end && new Date(t.date) > new Date(dateRange.end)) return false
        
        // Transaction type filter
        if (transactionTypeFilter !== 'all') {
          const hasRefill = (t.returns_breakdown?.max_empty?.kg6 || 0) + (t.returns_breakdown?.max_empty?.kg13 || 0) + (t.returns_breakdown?.max_empty?.kg50 || 0) > 0
          const hasOutright = (t.outright_breakdown?.kg6 || 0) + (t.outright_breakdown?.kg13 || 0) + (t.outright_breakdown?.kg50 || 0) > 0
          const hasSwipe = (t.returns_breakdown?.swap_empty?.kg6 || 0) + (t.returns_breakdown?.swap_empty?.kg13 || 0) + (t.returns_breakdown?.swap_empty?.kg50 || 0) > 0
          
          switch (transactionTypeFilter) {
            case 'refill':
              if (!hasRefill) return false
              break
            case 'outright':
              if (!hasOutright) return false
              break
            case 'swipe':
              if (!hasSwipe) return false
              break
          }
        }
        
        // Amount range filter
        const total = calculateTransactionTotal(t)
        if (minAmount && total < parseFloat(minAmount)) return false
        if (maxAmount && total > parseFloat(maxAmount)) return false
        
        // Status filter
        if (statusFilter !== 'all') {
          const paid = t.amount_paid || 0
          const outstanding = total - paid
          
          switch (statusFilter) {
            case 'paid':
              if (outstanding > 0) return false
              break
            case 'outstanding':
              if (outstanding <= 0) return false
              break
            case 'partial':
              if (outstanding <= 0 || outstanding >= total) return false
              break
          }
        }
        
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    
    return filtered
  }, [customerTransactions, dateRange, transactionTypeFilter, statusFilter, minAmount, maxAmount])

  const totalSales = filteredTransactions.reduce((sum, t) => sum + calculateTransactionTotal(t), 0)
  const totalPaid = filteredTransactions.reduce((sum, t) => sum + (t.amount_paid || 0), 0)
  const totalOutstanding = totalSales - totalPaid

  // Clear all filters
  const clearFilters = () => {
    setDateRange({ start: '', end: '' })
    setTransactionTypeFilter('all')
    setStatusFilter('all')
    setMinAmount('')
    setMaxAmount('')
  }

  const handlePrint = () => {
    const content = reportRef.current
    const printWindow = window.open("", "_blank")

    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Report - ${customerName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background: white;
              padding: 20px;
            }
            .report { max-width: 800px; margin: 0 auto; }
            .header { 
              background: linear-gradient(135deg, #1e293b, #334155); 
              color: white; 
              padding: 30px; 
              border-radius: 12px; 
              margin-bottom: 30px;
              text-align: center;
            }
            .company-name { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .report-title { font-size: 20px; margin-bottom: 5px; }
            .report-date { opacity: 0.9; }
            .summary-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
              gap: 20px; 
              margin-bottom: 30px; 
            }
            .summary-card { 
              background: #f8fafc; 
              padding: 20px; 
              border-radius: 8px; 
              border-left: 4px solid #f97316;
              text-align: center;
            }
            .summary-value { font-size: 24px; font-weight: bold; color: #1e293b; }
            .summary-label { color: #64748b; margin-top: 5px; }
            .customer-info { 
              background: #f8fafc; 
              padding: 20px; 
              border-radius: 8px; 
              margin-bottom: 30px; 
            }
            .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .info-item { display: flex; justify-content: space-between; }
            .info-label { font-weight: 600; color: #4b5563; }
            .transactions-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .transactions-table th, .transactions-table td { 
              padding: 12px; 
              text-align: left; 
              border-bottom: 1px solid #e5e7eb; 
            }
            .transactions-table th { 
              background: #f9fafb; 
              font-weight: 600; 
              color: #374151; 
            }
            .status-paid { color: #059669; font-weight: 600; }
            .status-outstanding { color: #dc2626; font-weight: 600; }
            @media print {
              body { padding: 0; background: #f8fafc !important; }
              .report { max-width: none; }
              .header {
                background: linear-gradient(135deg, #1e293b, #334155) !important;
                color: white !important;
              }
              .summary-card {
                background: #f8fafc !important;
                border-left: 4px solid #f97316 !important;
              }
              .transactions-table th {
                background: #f9fafb !important;
                color: #374151 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="report">
            ${content.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onfocus = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  const handleDownload = () => {
    const content = reportRef.current
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Report - ${customerName}</title>
          <meta charset="UTF-8">
          <style>
            /* Same styles as above */
          </style>
        </head>
        <body>
          <div class="report">
            ${content.innerHTML}
          </div>
        </body>
      </html>
    `

    const blob = new Blob([reportHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `customer-report-${customerName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!customer) return null

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
        
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {(dateRange.start || dateRange.end || transactionTypeFilter !== 'all' || statusFilter !== 'all' || minAmount || maxAmount) && (
            <span className="ml-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Transactions
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-white border-white hover:bg-white hover:text-gray-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label htmlFor="date-start">Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    id="date-start"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    placeholder="Start Date"
                    className="text-sm"
                  />
                  <Input
                    id="date-end"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    placeholder="End Date"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Transaction Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="transaction-type">Transaction Type</Label>
                <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="refill">Refills Only</SelectItem>
                    <SelectItem value="outright">Outright Sales</SelectItem>
                    <SelectItem value="swipe">Swipe Transactions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Payment Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Fully Paid</SelectItem>
                    <SelectItem value="outstanding">Outstanding</SelectItem>
                    <SelectItem value="partial">Partially Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range Filter */}
              <div className="space-y-2">
                <Label htmlFor="amount-range">Amount Range</Label>
                <div className="flex gap-2">
                  <Input
                    id="min-amount"
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="Min Amount"
                    className="text-sm"
                  />
                  <Input
                    id="max-amount"
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="Max Amount"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>Showing {filteredTransactions.length} transactions</strong>
                {(dateRange.start || dateRange.end || transactionTypeFilter !== 'all' || statusFilter !== 'all' || minAmount || maxAmount) && (
                  <div className="mt-2 text-xs">
                    Active filters: 
                    {dateRange.start && ` Date from ${dateRange.start}`}
                    {dateRange.end && ` to ${dateRange.end}`}
                    {transactionTypeFilter !== 'all' && ` Type: ${transactionTypeFilter}`}
                    {statusFilter !== 'all' && ` Status: ${statusFilter}`}
                    {minAmount && ` Min: ${formatCurrency(parseFloat(minAmount))}`}
                    {maxAmount && ` Max: ${formatCurrency(parseFloat(maxAmount))}`}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      <div ref={reportRef} className="bg-white rounded-lg border">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-8 rounded-t-lg text-center">
          <div className="text-3xl font-bold mb-2">MaxGas</div>
          <div className="text-xl mb-1">Customer Report</div>
          <div className="text-sm opacity-90">Generated on {formatDate(new Date())}</div>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-orange-500 text-center">
              <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalSales)}</div>
              <div className="text-sm text-slate-600">Total Sales</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-green-500 text-center">
              <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalPaid)}</div>
              <div className="text-sm text-slate-600">Total Paid</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-red-500 text-center">
              <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalOutstanding)}</div>
              <div className="text-sm text-slate-600">Outstanding</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-blue-500 text-center">
              <div className="text-2xl font-bold text-slate-800">{filteredTransactions.length}</div>
              <div className="text-sm text-slate-600">Transactions</div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-50 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Name:</span>
                <span className="text-slate-800">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Phone:</span>
                <span className="text-slate-800">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-600">Email:</span>
                  <span className="text-slate-800">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex justify-between md:col-span-2">
                  <span className="font-semibold text-slate-600">Address:</span>
                  <span className="text-slate-800">{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Transactions */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-3 text-left font-semibold text-slate-700 border-b">Date</th>
                    <th className="p-3 text-left font-semibold text-slate-700 border-b">Serial No.</th>
                    <th className="p-3 text-left font-semibold text-slate-700 border-b">Transaction #</th>
                    <th className="p-3 text-left font-semibold text-slate-700 border-b">Total</th>
                    <th className="p-3 text-left font-semibold text-slate-700 border-b">Paid</th>
                    <th className="p-3 text-left font-semibold text-slate-700 border-b">Outstanding</th>
                    <th className="p-3 text-left font-semibold text-slate-700 border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const total = calculateTransactionTotal(transaction)
                    const paid = transaction.amount_paid || 0
                    const outstanding = total - paid
                    return (
                      <tr key={transaction.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-3 text-slate-800">{formatDate(transaction.date)}</td>
                        <td className="p-3 font-mono text-sm text-slate-800">{transaction.transaction_number}</td>
                        <td className="p-3 text-slate-800">#{transaction.id}</td>
                        <td className="p-3 text-slate-800">{formatCurrency(total)}</td>
                        <td className="p-3 text-slate-800">{formatCurrency(paid)}</td>
                        <td className="p-3 text-slate-800">{formatCurrency(outstanding)}</td>
                        <td className="p-3">
                          <span className={`font-semibold ${outstanding <= 0 ? "text-green-600" : "text-red-600"}`}>
                            {outstanding <= 0 ? "Paid" : "Outstanding"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
