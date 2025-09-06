"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Download, FileText, AlertCircle } from "lucide-react"
import { useStore } from "../lib/store"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import { useToast } from "../hooks/use-toast"

export default function ExportImport() {
  const { customers, transactions } = useStore()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState("")
  const [exportOption, setExportOption] = useState("new") // "new" or "overwrite"

  const formatDateForExcel = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB') // DD/MM/YYYY format
  }

  const handleExport = () => {
    setIsExporting(true)
    setError("")

    try {
      // Safety checks
      const safeCustomers = customers || []
      const safeTransactions = transactions || []
      
      // Create workbook
      const wb = XLSX.utils.book_new()

      // Add customers sheet
      const customersData = safeCustomers.map((customer) => ({
        "Customer ID": customer.id,
        "Customer Name": customer.name,
        "Phone Number": customer.phone,
        "Email Address": customer.email || "",
        "Physical Address": customer.address || "",
        "Financial Balance": customer.financial_balance || 0,
        "Cylinder Balance": customer.cylinder_balance || 0,
        "Cylinder Balance 6kg": customer.cylinder_balance_6kg || 0,
        "Cylinder Balance 13kg": customer.cylinder_balance_13kg || 0,
        "Cylinder Balance 50kg": customer.cylinder_balance_50kg || 0,
        "Date Added": formatDateForExcel(customer.createdAt || new Date().toISOString()),
      }))
      
      const customersWs = XLSX.utils.json_to_sheet(customersData)
      XLSX.utils.book_append_sheet(wb, customersWs, "Customers")

      // Add transactions sheet with current database schema
      const transactionsData = safeTransactions.map((transaction) => {
        const customer = safeCustomers.find(c => c.id === transaction.customerId)
        const returns = transaction.returns_breakdown || {}
        const outright = transaction.outright_breakdown || {}
        
        return {
          "Transaction ID": transaction.id,
          "Transaction Number": transaction.transaction_number || "",
          "Customer ID": transaction.customerId,
          "Customer Name": customer?.name || "Unknown",
          "Transaction Date": formatDateForExcel(transaction.date),
          "Load 6kg": transaction.load_6kg || 0,
          "Load 13kg": transaction.load_13kg || 0,
          "Load 50kg": transaction.load_50kg || 0,
          "Total Load": transaction.total_load || 0,
          // Max Empty Returns
          "Max Empty 6kg": returns.max_empty?.kg6 || 0,
          "Max Empty 13kg": returns.max_empty?.kg13 || 0,
          "Max Empty 50kg": returns.max_empty?.kg50 || 0,
          "Max Empty Price 6kg": returns.max_empty?.price6 || 135,
          "Max Empty Price 13kg": returns.max_empty?.price13 || 135,
          "Max Empty Price 50kg": returns.max_empty?.price50 || 135,
          // Swap Empty Returns
          "Swap Empty 6kg": returns.swap_empty?.kg6 || 0,
          "Swap Empty 13kg": returns.swap_empty?.kg13 || 0,
          "Swap Empty 50kg": returns.swap_empty?.kg50 || 0,
          "Swap Empty Price 6kg": returns.swap_empty?.price6 || 160,
          "Swap Empty Price 13kg": returns.swap_empty?.price13 || 160,
          "Swap Empty Price 50kg": returns.swap_empty?.price50 || 160,
          // Return Full
          "Return Full 6kg": returns.return_full?.kg6 || 0,
          "Return Full 13kg": returns.return_full?.kg13 || 0,
          "Return Full 50kg": returns.return_full?.kg50 || 0,
          // Outright Sales
          "Outright 6kg": outright.kg6 || 0,
          "Outright 13kg": outright.kg13 || 0,
          "Outright 50kg": outright.kg50 || 0,
          "Outright Price 6kg": outright.price6 || 2200,
          "Outright Price 13kg": outright.price13 || 4400,
          "Outright Price 50kg": outright.price50 || 8000,
          // Financial Details
          "Total Bill": transaction.total_bill || 0,
          "Amount Paid": transaction.amount_paid || 0,
          "Financial Balance": transaction.financial_balance || 0,
          "Payment Method": transaction.payment_method || "cash",
          // Cylinder Balances
          "Cylinder Balance 6kg": transaction.cylinder_balance_6kg || 0,
          "Cylinder Balance 13kg": transaction.cylinder_balance_13kg || 0,
          "Cylinder Balance 50kg": transaction.cylinder_balance_50kg || 0,
          "Total Cylinder Balance": transaction.cylinder_balance || 0,
          "Notes": transaction.notes || "",
          "Created At": formatDateForExcel(transaction.createdAt),
          "Updated At": formatDateForExcel(transaction.updatedAt),
        }
      })
      
      const transactionsWs = XLSX.utils.json_to_sheet(transactionsData)
      XLSX.utils.book_append_sheet(wb, transactionsWs, "Transactions")

      // Create separate worksheets for each customer
      safeCustomers.forEach(customer => {
        const customerTransactions = safeTransactions.filter(t => t.customerId === customer.id)
        
        if (customerTransactions.length > 0) {
          const customerData = customerTransactions.map((transaction) => {
            const returns = transaction.returns_breakdown || {}
            const outright = transaction.outright_breakdown || {}
            
            return {
              "Transaction ID": transaction.id,
              "Transaction Number": transaction.transaction_number || "",
              "Transaction Date": formatDateForExcel(transaction.date),
              "Load 6kg": transaction.load_6kg || 0,
              "Load 13kg": transaction.load_13kg || 0,
              "Load 50kg": transaction.load_50kg || 0,
              "Total Load": transaction.total_load || 0,
              // Max Empty Returns
              "Max Empty 6kg": returns.max_empty?.kg6 || 0,
              "Max Empty 13kg": returns.max_empty?.kg13 || 0,
              "Max Empty 50kg": returns.max_empty?.kg50 || 0,
              "Max Empty Price 6kg": returns.max_empty?.price6 || 135,
              "Max Empty Price 13kg": returns.max_empty?.price13 || 135,
              "Max Empty Price 50kg": returns.max_empty?.price50 || 135,
              // Swap Empty Returns
              "Swap Empty 6kg": returns.swap_empty?.kg6 || 0,
              "Swap Empty 13kg": returns.swap_empty?.kg13 || 0,
              "Swap Empty 50kg": returns.swap_empty?.kg50 || 0,
              "Swap Empty Price 6kg": returns.swap_empty?.price6 || 160,
              "Swap Empty Price 13kg": returns.swap_empty?.price13 || 160,
              "Swap Empty Price 50kg": returns.swap_empty?.price50 || 160,
              // Return Full
              "Return Full 6kg": returns.return_full?.kg6 || 0,
              "Return Full 13kg": returns.return_full?.kg13 || 0,
              "Return Full 50kg": returns.return_full?.kg50 || 0,
              // Outright Sales
              "Outright 6kg": outright.kg6 || 0,
              "Outright 13kg": outright.kg13 || 0,
              "Outright 50kg": outright.kg50 || 0,
              "Outright Price 6kg": outright.price6 || 2200,
              "Outright Price 13kg": outright.price13 || 4400,
              "Outright Price 50kg": outright.price50 || 8000,
              // Financial Details
              "Total Bill": transaction.total_bill || 0,
              "Amount Paid": transaction.amount_paid || 0,
              "Financial Balance": transaction.financial_balance || 0,
              "Payment Method": transaction.payment_method || "cash",
              // Cylinder Balances
              "Cylinder Balance 6kg": transaction.cylinder_balance_6kg || 0,
              "Cylinder Balance 13kg": transaction.cylinder_balance_13kg || 0,
              "Cylinder Balance 50kg": transaction.cylinder_balance_50kg || 0,
              "Total Cylinder Balance": transaction.cylinder_balance || 0,
              "Notes": transaction.notes || "",
              "Created At": formatDateForExcel(transaction.createdAt),
            }
          })
          
          const customerWs = XLSX.utils.json_to_sheet(customerData)
          const sheetName = customer.name.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 31) // Excel sheet name limit
          XLSX.utils.book_append_sheet(wb, customerWs, sheetName)
        }
      })

      // Add summary sheet
      const summaryData = safeCustomers.map(customer => {
        const customerTransactions = safeTransactions.filter(t => t.customerId === customer.id)
        const totalSales = customerTransactions.reduce((sum, t) => sum + (t.total_bill || 0), 0)
        const totalPaid = customerTransactions.reduce((sum, t) => sum + (t.amount_paid || 0), 0)
        const outstanding = totalSales - totalPaid
        
        return {
          "Customer ID": customer.id,
          "Customer Name": customer.name,
          "Phone Number": customer.phone,
          "Total Transactions": customerTransactions.length,
          "Total Sales": totalSales,
          "Total Paid": totalPaid,
          "Outstanding Amount": outstanding,
          "Financial Balance": customer.financial_balance || 0,
          "Cylinder Balance": customer.cylinder_balance || 0,
          "Status": outstanding > 0 ? "Outstanding" : "Paid"
        }
      })
      
      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary")

      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })

      // Generate filename based on export option
      const timestamp = new Date().toISOString().split("T")[0]
      const fileName = exportOption === "overwrite" 
        ? `maxgas-data.xlsx` 
        : `maxgas-data-${timestamp}.xlsx`
      
      saveAs(blob, fileName)

      toast({ 
        title: "Export Successful", 
        description: `File saved as ${fileName}${exportOption === "overwrite" ? " (overwritten)" : ""}`, 
        variant: "success" 
      })
    } catch (error) {
      console.error("Export error:", error)
      setError("Export failed. Please try again. Error: " + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="shadow-xl border-0 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <FileText className="w-16 h-16 mx-auto text-indigo-600" />
            <h3 className="text-xl font-bold mt-4">Export to Excel</h3>
            <p className="text-gray-600 mt-2 mb-4">
              Export all your customers and transactions to an Excel file with multiple worksheets
            </p>
            <div className="text-sm text-gray-500 mb-6 space-y-1">
              <p>• Customers worksheet with all customer details and balances</p>
              <p>• Transactions worksheet with current database schema (returns_breakdown, outright_breakdown)</p>
              <p>• Individual worksheets for each customer with their transaction history</p>
              <p>• Summary worksheet with customer totals and balances</p>
            </div>
            
            {/* Export Options */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Export Options:</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exportOption"
                    value="new"
                    checked={exportOption === "new"}
                    onChange={(e) => setExportOption(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Create new export file (with timestamp)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exportOption"
                    value="overwrite"
                    checked={exportOption === "overwrite"}
                    onChange={(e) => setExportOption(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Overwrite previous export (same filename)</span>
                </label>
              </div>
            </div>
            
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Data Check Card */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Data Check & Debug
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Check for data issues and missing load information in existing transactions.
              </p>
            </div>
            
            <Button
              onClick={() => {
                const state = useStore.getState()
                const transactions = state.transactions
                const customers = state.customers
                console.log("Current data state:")
                console.log("Customers:", (customers || []).length)
                console.log("Transactions:", transactions.length)
                if (transactions.length > 0) {
                  console.log("Sample transaction:", transactions[0])
                }
                toast({ title: 'Current Data', description: `${(customers || []).length} customers, ${transactions.length} transactions. Check console for details.`, variant: 'info' })
              }}
              variant="outline"
              className="w-full"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Check Current Data
            </Button>

            <div className="text-xs text-gray-500">
              <p>This will show the current number of customers and transactions in the system.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}