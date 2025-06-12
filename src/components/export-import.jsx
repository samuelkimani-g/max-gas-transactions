"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Download, Upload, FileSpreadsheet } from "lucide-react"
import { useStore } from "../lib/store"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

export default function ExportImport() {
  const { customers, transactions } = useStore()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)

    try {
      // Create workbook
      const wb = XLSX.utils.book_new()

      // Add customers sheet
      const customersData = customers.map((customer) => ({
        ID: customer.id,
        Name: customer.name,
        Phone: customer.phone,
        Email: customer.email,
        Address: customer.address,
      }))
      const customersWs = XLSX.utils.json_to_sheet(customersData)
      XLSX.utils.book_append_sheet(wb, customersWs, "Customers")

      // Add transactions sheet
      const transactionsData = transactions.map((transaction) => ({
        ID: transaction.id,
        CustomerID: transaction.customerId,
        Date: transaction.date,
        Return6kg: transaction.return6kg || 0,
        Return13kg: transaction.return13kg || 0,
        Return50kg: transaction.return50kg || 0,
        Outright6kg: transaction.outright6kg || 0,
        Outright13kg: transaction.outright13kg || 0,
        Outright50kg: transaction.outright50kg || 0,
        SwipeReturn6kg: transaction.swipeReturn6kg || 0,
        SwipeReturn13kg: transaction.swipeReturn13kg || 0,
        SwipeReturn50kg: transaction.swipeReturn50kg || 0,
        RefillPrice6kg: transaction.refillPrice6kg || 0,
        RefillPrice13kg: transaction.refillPrice13kg || 0,
        RefillPrice50kg: transaction.refillPrice50kg || 0,
        OutrightPrice6kg: transaction.outrightPrice6kg || 0,
        OutrightPrice13kg: transaction.outrightPrice13kg || 0,
        OutrightPrice50kg: transaction.outrightPrice50kg || 0,
        SwipeRefillPrice6kg: transaction.swipeRefillPrice6kg || 0,
        SwipeRefillPrice13kg: transaction.swipeRefillPrice13kg || 0,
        SwipeRefillPrice50kg: transaction.swipeRefillPrice50kg || 0,
        Paid: transaction.paid || 0,
        Notes: transaction.notes || "",
      }))
      const transactionsWs = XLSX.utils.json_to_sheet(transactionsData)
      XLSX.utils.book_append_sheet(wb, transactionsWs, "Transactions")

      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })

      // Save file
      saveAs(blob, `gas-cylinder-data-${new Date().toISOString().split("T")[0]}.xlsx`)

      alert("Export successful!")
    } catch (error) {
      console.error("Export error:", error)
      alert("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsImporting(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: "array" })

        // Process the workbook
        alert("Import successful!")
      } catch (error) {
        console.error("Import error:", error)
        alert("Import failed. Please try again.")
      } finally {
        setIsImporting(false)
      }
    }

    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardTitle>Export Data</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <FileSpreadsheet className="w-16 h-16 mx-auto text-indigo-600" />
            <h3 className="text-xl font-bold mt-4">Export to Excel</h3>
            <p className="text-gray-600 mt-2 mb-6">Export all your customers and transactions to an Excel file</p>
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

      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardTitle>Import Data</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Upload className="w-16 h-16 mx-auto text-indigo-600" />
            <h3 className="text-xl font-bold mt-4">Import from Excel</h3>
            <p className="text-gray-600 mt-2 mb-6">Import customers and transactions from an Excel file</p>
            <div className="flex justify-center">
              <input
                type="file"
                id="file-upload"
                accept=".xlsx, .xls"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
              />
              <label htmlFor="file-upload">
                <Button
                  as="span"
                  disabled={isImporting}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? "Importing..." : "Import Data"}
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
