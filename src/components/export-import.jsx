"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Download, Upload, FileText, AlertCircle } from "lucide-react"
import { useStore } from "../lib/store"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import { useToast } from "../hooks/use-toast"

export default function ExportImport() {
  const { customers, transactions, addCustomer, addTransaction } = useStore()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState("")

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
        "Date Added": formatDateForExcel(customer.dateAdded || new Date().toISOString()),
      }))
      
      const customersWs = XLSX.utils.json_to_sheet(customersData)
      XLSX.utils.book_append_sheet(wb, customersWs, "Customers")

      // Add transactions sheet with all data including dates
      const transactionsData = safeTransactions.map((transaction) => ({
        "Transaction ID": transaction.id,
        "Customer ID": transaction.customerId,
        "Customer Name": safeCustomers.find(c => c.id === transaction.customerId)?.name || "Unknown",
        "Transaction Date": formatDateForExcel(transaction.date),
        "Load 6kg": transaction.maxGas6kgLoad || 0,
        "Load 13kg": transaction.maxGas13kgLoad || 0,
        "Load 50kg": transaction.maxGas50kgLoad || 0,
        "Return 6kg": transaction.return6kg || 0,
        "Return 13kg": transaction.return13kg || 0,
        "Return 50kg": transaction.return50kg || 0,
        "Outright 6kg": transaction.outright6kg || 0,
        "Outright 13kg": transaction.outright13kg || 0,
        "Outright 50kg": transaction.outright50kg || 0,
        "Swipe Return 6kg": transaction.swipeReturn6kg || 0,
        "Swipe Return 13kg": transaction.swipeReturn13kg || 0,
        "Swipe Return 50kg": transaction.swipeReturn50kg || 0,
        "Refill Price 6kg": transaction.refillPrice6kg || 135,
        "Refill Price 13kg": transaction.refillPrice13kg || 135,
        "Refill Price 50kg": transaction.refillPrice50kg || 135,
        "Outright Price 6kg": transaction.outrightPrice6kg || 3200,
        "Outright Price 13kg": transaction.outrightPrice13kg || 3500,
        "Outright Price 50kg": transaction.outrightPrice50kg || 8500,
        "Swipe Refill Price 6kg": transaction.swipeRefillPrice6kg || 160,
        "Swipe Refill Price 13kg": transaction.swipeRefillPrice13kg || 160,
        "Swipe Refill Price 50kg": transaction.swipeRefillPrice50kg || 160,
        "Amount Paid": transaction.paid || 0,
        "Notes": transaction.notes || "",
        "Total Amount": calculateTransactionTotal(transaction),
        "Outstanding Amount": calculateTransactionTotal(transaction) - (transaction.paid || 0),
      }))
      
      const transactionsWs = XLSX.utils.json_to_sheet(transactionsData)
      XLSX.utils.book_append_sheet(wb, transactionsWs, "Transactions")

      // Create separate worksheets for each employee (customer)
      const employeeSheets = {}
      
      safeCustomers.forEach(customer => {
        const customerTransactions = safeTransactions.filter(t => t.customerId === customer.id)
        
        if (customerTransactions.length > 0) {
          const employeeData = customerTransactions.map((transaction) => ({
            "Transaction ID": transaction.id,
            "Transaction Date": formatDateForExcel(transaction.date),
            "Return 6kg": transaction.return6kg || 0,
            "Return 13kg": transaction.return13kg || 0,
            "Return 50kg": transaction.return50kg || 0,
            "Outright 6kg": transaction.outright6kg || 0,
            "Outright 13kg": transaction.outright13kg || 0,
            "Outright 50kg": transaction.outright50kg || 0,
            "Swipe Return 6kg": transaction.swipeReturn6kg || 0,
            "Swipe Return 13kg": transaction.swipeReturn13kg || 0,
            "Swipe Return 50kg": transaction.swipeReturn50kg || 0,
            "Refill Price 6kg": transaction.refillPrice6kg || 135,
            "Refill Price 13kg": transaction.refillPrice13kg || 135,
            "Refill Price 50kg": transaction.refillPrice50kg || 135,
            "Outright Price 6kg": transaction.outrightPrice6kg || 3200,
            "Outright Price 13kg": transaction.outrightPrice13kg || 3500,
            "Outright Price 50kg": transaction.outrightPrice50kg || 8500,
            "Swipe Refill Price 6kg": transaction.swipeRefillPrice6kg || 160,
            "Swipe Refill Price 13kg": transaction.swipeRefillPrice13kg || 160,
            "Swipe Refill Price 50kg": transaction.swipeRefillPrice50kg || 160,
            "Amount Paid": transaction.paid || 0,
            "Notes": transaction.notes || "",
            "Total Amount": calculateTransactionTotal(transaction),
            "Outstanding Amount": calculateTransactionTotal(transaction) - (transaction.paid || 0),
          }))
          
          const employeeWs = XLSX.utils.json_to_sheet(employeeData)
          const sheetName = customer.name.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 31) // Excel sheet name limit
          XLSX.utils.book_append_sheet(wb, employeeWs, sheetName)
        }
      })

      // Add combined data sheet (for easy import)
      const combinedData = []
      
      safeCustomers.forEach(customer => {
        const customerTransactions = safeTransactions.filter(t => t.customerId === customer.id)
        
        if (customerTransactions.length === 0) {
          // Add customer with no transactions
          combinedData.push({
            "Customer ID": customer.id,
            "Customer Name": customer.name,
            "Phone Number": customer.phone,
            "Email Address": customer.email || "",
            "Physical Address": customer.address || "",
            "Transaction Date": "",
            "Load 6kg": 0,
            "Load 13kg": 0,
            "Load 50kg": 0,
            "Return 6kg": 0,
            "Return 13kg": 0,
            "Return 50kg": 0,
            "Outright 6kg": 0,
            "Outright 13kg": 0,
            "Outright 50kg": 0,
            "Swipe Return 6kg": 0,
            "Swipe Return 13kg": 0,
            "Swipe Return 50kg": 0,
            "Refill Price 6kg": 135,
            "Refill Price 13kg": 135,
            "Refill Price 50kg": 135,
            "Outright Price 6kg": 3200,
            "Outright Price 13kg": 3500,
            "Outright Price 50kg": 8500,
            "Swipe Refill Price 6kg": 160,
            "Swipe Refill Price 13kg": 160,
            "Swipe Refill Price 50kg": 160,
            "Amount Paid": 0,
            "Notes": "",
            "Total Amount": 0,
            "Outstanding Amount": 0,
          })
        } else {
          // Add each transaction with customer info
          customerTransactions.forEach(transaction => {
            combinedData.push({
              "Customer ID": customer.id,
              "Customer Name": customer.name,
              "Phone Number": customer.phone,
              "Email Address": customer.email || "",
              "Physical Address": customer.address || "",
              "Transaction Date": formatDateForExcel(transaction.date),
              "Load 6kg": transaction.maxGas6kgLoad || 0,
              "Load 13kg": transaction.maxGas13kgLoad || 0,
              "Load 50kg": transaction.maxGas50kgLoad || 0,
              "Return 6kg": transaction.return6kg || 0,
              "Return 13kg": transaction.return13kg || 0,
              "Return 50kg": transaction.return50kg || 0,
              "Outright 6kg": transaction.outright6kg || 0,
              "Outright 13kg": transaction.outright13kg || 0,
              "Outright 50kg": transaction.outright50kg || 0,
              "Swipe Return 6kg": transaction.swipeReturn6kg || 0,
              "Swipe Return 13kg": transaction.swipeReturn13kg || 0,
              "Swipe Return 50kg": transaction.swipeReturn50kg || 0,
              "Refill Price 6kg": transaction.refillPrice6kg || 135,
              "Refill Price 13kg": transaction.refillPrice13kg || 135,
              "Refill Price 50kg": transaction.refillPrice50kg || 135,
              "Outright Price 6kg": transaction.outrightPrice6kg || 3200,
              "Outright Price 13kg": transaction.outrightPrice13kg || 3500,
              "Outright Price 50kg": transaction.outrightPrice50kg || 8500,
              "Swipe Refill Price 6kg": transaction.swipeRefillPrice6kg || 160,
              "Swipe Refill Price 13kg": transaction.swipeRefillPrice13kg || 160,
              "Swipe Refill Price 50kg": transaction.swipeRefillPrice50kg || 160,
              "Amount Paid": transaction.paid || 0,
              "Notes": transaction.notes || "",
              "Total Amount": calculateTransactionTotal(transaction),
              "Outstanding Amount": calculateTransactionTotal(transaction) - (transaction.paid || 0),
            })
          })
        }
      })
      
      const combinedWs = XLSX.utils.json_to_sheet(combinedData)
      XLSX.utils.book_append_sheet(wb, combinedWs, "Combined Data")

      // Add summary sheet
      const summaryData = safeCustomers.map(customer => {
        const customerTransactions = safeTransactions.filter(t => t.customerId === customer.id)
        const totalSales = customerTransactions.reduce((sum, t) => sum + calculateTransactionTotal(t), 0)
        const totalPaid = customerTransactions.reduce((sum, t) => sum + (t.paid || 0), 0)
        const outstanding = totalSales - totalPaid
        
        return {
          "Customer ID": customer.id,
          "Customer Name": customer.name,
          "Phone Number": customer.phone,
          "Total Transactions": customerTransactions.length,
          "Total Sales": totalSales,
          "Total Paid": totalPaid,
          "Outstanding Amount": outstanding,
          "Status": outstanding > 0 ? "Outstanding" : "Paid"
        }
      })
      
      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary")

      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })

      // Save file
      const fileName = `maxgas-data-${new Date().toISOString().split("T")[0]}.xlsx`
      saveAs(blob, fileName)

      toast({ title: "Export Successful", description: `File saved as ${fileName}`, variant: "success" })
    } catch (error) {
      console.error("Export error:", error)
      setError("Export failed. Please try again. Error: " + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (e) => {
    console.log("Import triggered", e)
    
    const file = e.target.files[0]
    if (!file) {
      console.log("No file selected")
      setError("Please select a file to import")
      return
    }

    console.log("File selected:", file.name, file.type, file.size)

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError("Please select a valid Excel file (.xlsx or .xls)")
      return
    }

    setIsImporting(true)
    setError("")

    const reader = new FileReader()
    
    reader.onload = async (event) => {
      try {
        console.log("File read successfully")
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: "array" })

        console.log("Workbook sheets:", workbook.SheetNames)
        
        let importedCustomers = 0
        let importedTransactions = 0
        let errors = []
        let customerMap = new Map() // Map to track customers by name
        let customerIdMap = new Map() // Map old customer IDs to new ones
        let nextCustomerId = 1

        // Helper function to parse date from DD/MM format
        const parseDateFromDDMM = (dateValue) => {
          if (!dateValue) return new Date().toISOString()
          
          console.log("Parsing date value:", dateValue, typeof dateValue)
          
          if (typeof dateValue === 'string') {
            // Handle DD/MM format (e.g., "12/05", "13/05")
            const dateMatch = dateValue.match(/^(\d{1,2})\/(\d{1,2})$/)
            if (dateMatch) {
              const day = parseInt(dateMatch[1])
              const month = parseInt(dateMatch[2])
              // Use 2024 for DD/MM format (since your data is from 2024)
              const year = 2024
              const date = new Date(year, month - 1, day) // month is 0-indexed
              console.log("Parsed DD/MM date:", date)
              return date.toISOString()
            }
            
            // Try standard date parsing
            const parsedDate = new Date(dateValue)
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString()
            }
          } else if (typeof dateValue === 'number') {
            // Handle Excel date numbers
            const excelDate = new Date((dateValue - 25569) * 86400 * 1000)
            return excelDate.toISOString()
          }
          
          console.log("Could not parse date, using current date")
          return new Date().toISOString()
        }

        // Process each sheet
        for (const sheetName of workbook.SheetNames) {
          console.log("Processing sheet:", sheetName)
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          console.log("Sheet data rows:", jsonData.length)
          
          if (jsonData.length < 2) {
            console.log("Skipping empty sheet:", sheetName)
            continue // Skip empty sheets
          }
          
          const headers = jsonData[0]
          const rows = jsonData.slice(1)
          
          console.log("Headers:", headers)
          console.log("First row:", rows[0])
          
          // Check if this is a summary sheet (first type - has Date, Name, Max gas loads, etc.)
          const isSummarySheet = headers.some(h => 
            h && typeof h === 'string' && (
              h.toLowerCase().includes('max gas') || 
              h.toLowerCase().includes('balance') ||
              h.toLowerCase().includes('return swipe')
            )
          )
          
          // Check if this is a transaction sheet (second type - has detailed transaction data)
          const isTransactionSheet = headers.some(h => 
            h && typeof h === 'string' && (
              h.toLowerCase().includes('price per unit') || 
              h.toLowerCase().includes('refill price') ||
              h.toLowerCase().includes('outright price')
            )
          )
          
          // Check if this is a combined data sheet (has both customer and transaction data)
          const hasCustomerData = headers.some(h => 
            h && typeof h === 'string' && (
              h.toLowerCase().includes('customer') || 
              h.toLowerCase().includes('phone')
            )
          )
          
          const hasTransactionData = headers.some(h => 
            h && typeof h === 'string' && (
              h.toLowerCase().includes('transaction') || 
              h.toLowerCase().includes('return') ||
              h.toLowerCase().includes('outright') ||
              h.toLowerCase().includes('swipe')
            )
          )

          if (isSummarySheet) {
            console.log("Processing summary sheet (first type)")
            // This is the first type of sheet with Date, Name, Max gas loads, etc.
            for (let [index, row] of rows.entries()) {
              try {
                if (!row || row.length < 2) {
                  console.log("Skipping incomplete row:", row)
                  return
                }

                // Parse date from first column
                const dateValue = row[0]
                const transactionDate = parseDateFromDDMM(dateValue)
                
                // Extract customer name from second column
                const customerName = String(row[1] || "").trim()
                if (!customerName) {
                  console.log("Skipping row - missing customer name:", row)
                  return
                }

                // Create or find customer
                const customerKey = customerName
                let customerId

                if (customerMap.has(customerKey)) {
                  customerId = customerMap.get(customerKey)
                  console.log("Using existing customer ID:", customerId, "for:", customerName)
                } else {
                  // Create new customer with valid phone number
                  const newCustomer = {
                    name: customerName,
                    phone: `+254700${String(nextCustomerId).padStart(6, '0')}`,
                    email: "",
                    address: "",
                  }
                  try {
                    const createdCustomer = await addCustomer(newCustomer)
                    customerId = createdCustomer.id
                    customerMap.set(customerKey, customerId)
                    importedCustomers++
                    console.log("Created new customer:", customerName, "with ID:", customerId)
                  } catch (error) {
                    console.error("Failed to create customer:", customerName, error)
                    errors.push(`Failed to create customer ${customerName}: ${error.message}`)
                    return // Skip this row
                  }
                }

                // Extract transaction data based on the summary sheet structure
                // Columns: Date, Name, Max gas 6kg load, Max gas 13kg load, Max gas 50kg load, 
                // 6kgs Max Return, 13kgs Max Return, 50kgs Max Return, 
                // 6kgs Return swipe, 13kgs Return swipe, 50kgs Return swipe, 
                // Balance 6kg, Balance 13kg, Balance 50kg
                
                console.log("Processing row data:", row)
                console.log("Row[0] (Date):", row[0])
                console.log("Row[1] (Name):", row[1])
                console.log("Row[2] (Max gas 6kg load):", row[2])
                console.log("Row[3] (Max gas 13kg load):", row[3])
                console.log("Row[4] (Max gas 50kg load):", row[4])
                console.log("Row[5] (6kgs Max Return):", row[5])
                console.log("Row[6] (13kgs Max Return):", row[6])
                console.log("Row[7] (50kgs Max Return):", row[7])
                console.log("Row[8] (6kgs Return swipe):", row[8])
                console.log("Row[9] (13kgs Return swipe):", row[9])
                console.log("Row[10] (50kgs Return swipe):", row[10])
                
                const transaction = {
                  customerId: customerId,
                  date: transactionDate,
                  // Max gas loads - these are cylinders given to customer (loads)
                  maxGas6kgLoad: parseFloat(row[2]) || 0,
                  maxGas13kgLoad: parseFloat(row[3]) || 0,
                  maxGas50kgLoad: parseFloat(row[4]) || 0,
                  // Max returns become return refills (these are the returns)
                  return6kg: parseFloat(row[5]) || 0,
                  return13kg: parseFloat(row[6]) || 0,
                  return50kg: parseFloat(row[7]) || 0,
                  // Return swipes (these are the swipe returns)
                  swipeReturn6kg: parseFloat(row[8]) || 0,
                  swipeReturn13kg: parseFloat(row[9]) || 0,
                  swipeReturn50kg: parseFloat(row[10]) || 0,
                  // No outright sales in summary sheet format
                  outright6kg: 0,
                  outright13kg: 0,
                  outright50kg: 0,
                  // Default prices
                  refillPrice6kg: 135,
                  refillPrice13kg: 135,
                  refillPrice50kg: 135,
                  outrightPrice6kg: 3200,
                  outrightPrice13kg: 3500,
                  outrightPrice50kg: 8500,
                  swipeRefillPrice6kg: 160,
                  swipeRefillPrice13kg: 160,
                  swipeRefillPrice50kg: 160,
                  paid: 0, // Will be calculated based on balances
                  notes: `Imported from summary sheet - ${customerName}`,
                }

                // Only add transaction if there's actual transaction data
                const hasTransactionData = transaction.maxGas6kgLoad > 0 || transaction.maxGas13kgLoad > 0 || 
                                         transaction.maxGas50kgLoad > 0 || transaction.return6kg > 0 || 
                                         transaction.return13kg > 0 || transaction.return50kg > 0 ||
                                         transaction.outright6kg > 0 || transaction.outright13kg > 0 || 
                                         transaction.outright50kg > 0 || transaction.swipeReturn6kg > 0 || 
                                         transaction.swipeReturn13kg > 0 || transaction.swipeReturn50kg > 0

                console.log("Transaction data check:", {
                  customerName,
                  maxGas6kgLoad: transaction.maxGas6kgLoad,
                  maxGas13kgLoad: transaction.maxGas13kgLoad,
                  maxGas50kgLoad: transaction.maxGas50kgLoad,
                  return6kg: transaction.return6kg,
                  return13kg: transaction.return13kg,
                  return50kg: transaction.return50kg,
                  swipeReturn6kg: transaction.swipeReturn6kg,
                  swipeReturn13kg: transaction.swipeReturn13kg,
                  swipeReturn50kg: transaction.swipeReturn50kg,
                  hasTransactionData
                })

                if (hasTransactionData) {
                  await addTransaction(transaction)
                  importedTransactions++
                  console.log("Summary transaction imported for customer:", customerName, "Date:", transactionDate)
                } else {
                  console.log("Skipping transaction - no data for customer:", customerName)
                }

              } catch (error) {
                console.error("Error processing summary sheet row:", error)
                errors.push(`Summary row ${index + 2}: ${error.message}`)
              }
            }
          } else if (isTransactionSheet) {
            console.log("Processing transaction sheet (second type)")
            // This is the second type of sheet with detailed transaction data
            for (let [index, row] of rows.entries()) {
              try {
                if (!row || row.length < 2) {
                  console.log("Skipping incomplete row:", row)
                  return
                }

                // Parse date from first column
                const dateValue = row[0]
                const transactionDate = parseDateFromDDMM(dateValue)
                
                // Extract customer name from second column
                const customerName = String(row[1] || "").trim()
                if (!customerName) {
                  console.log("Skipping row - missing customer name:", row)
                  return
                }

                // Create or find customer
                const customerKey = customerName
                let customerId

                if (customerMap.has(customerKey)) {
                  customerId = customerMap.get(customerKey)
                  console.log("Using existing customer ID:", customerId, "for:", customerName)
                } else {
                  // Create new customer with valid phone number
                  const newCustomer = {
                    name: customerName,
                    phone: `+254700${String(nextCustomerId).padStart(6, '0')}`, // Generate valid phone number
                    email: "",
                    address: "",
                  }
                  
                  try {
                    const createdCustomer = await addCustomer(newCustomer)
                    customerId = createdCustomer.id
                    customerMap.set(customerKey, customerId)
                    importedCustomers++
                    console.log("Created new customer:", customerName, "with ID:", customerId)
                  } catch (error) {
                    console.error("Failed to create customer:", customerName, error)
                    errors.push(`Failed to create customer ${customerName}: ${error.message}`)
                    return // Skip this row
                  }
                }

                // Extract transaction data based on the transaction sheet structure
                // Columns: Date, Name, Max gas 6kg load, Max gas 13kg load, Max gas 50kg load,
                // 6kgs Max Return, 6kg Max Outright, price per unit, 6kg Max refill price, Total Amount,
                // 13kgs Max Return, 13kg Max Outright, price per unit, 13kg Max Refill Price, Total Amount,
                // 50kgs Max Return, 50kg Max Refill Price, Total Amount,
                // 6kgs Return swipe, 6kg Refill Price, Total Amount,
                // 13kgs Return swipe, 13kg Refill Price, Total Amount,
                // Balance 6kg, Balance 13kg, Balance 50kg, Total Amount(forall), Paid, Ballance
                
                const transaction = {
                  customerId: customerId,
                  date: transactionDate,
                  // Max gas loads - these are cylinders given to customer (loads)
                  maxGas6kgLoad: parseFloat(row[2]) || 0,
                  maxGas13kgLoad: parseFloat(row[3]) || 0,
                  maxGas50kgLoad: parseFloat(row[4]) || 0,
                  // Max returns become return refills
                  return6kg: parseFloat(row[5]) || 0,
                  return13kg: parseFloat(row[10]) || 0,
                  return50kg: parseFloat(row[15]) || 0,
                  // Return swipes
                  swipeReturn6kg: parseFloat(row[18]) || 0,
                  swipeReturn13kg: parseFloat(row[21]) || 0,
                  swipeReturn50kg: 0, // Not in this format
                  // No outright sales in this format (Max gas loads are loads, not sales)
                  outright6kg: 0,
                  outright13kg: 0,
                  outright50kg: 0,
                  // Prices from the sheet
                  refillPrice6kg: parseFloat(row[8]) || 135,
                  refillPrice13kg: parseFloat(row[13]) || 135,
                  refillPrice50kg: parseFloat(row[16]) || 135,
                  outrightPrice6kg: 3200, // Default since not in sheet
                  outrightPrice13kg: 3500, // Default since not in sheet
                  outrightPrice50kg: 8500, // Default since not in sheet
                  swipeRefillPrice6kg: parseFloat(row[19]) || 160,
                  swipeRefillPrice13kg: parseFloat(row[22]) || 160,
                  swipeRefillPrice50kg: 160, // Default since not in sheet
                  paid: parseFloat(row[26]) || 0, // Paid column
                  notes: `Imported from transaction sheet - ${customerName}`,
                }

                // Only add transaction if there's actual transaction data
                const hasTransactionData = transaction.maxGas6kgLoad > 0 || transaction.maxGas13kgLoad > 0 || 
                                         transaction.maxGas50kgLoad > 0 || transaction.return6kg > 0 || 
                                         transaction.return13kg > 0 || transaction.return50kg > 0 ||
                                         transaction.outright6kg > 0 || transaction.outright13kg > 0 || 
                                         transaction.outright50kg > 0 || transaction.swipeReturn6kg > 0 || 
                                         transaction.swipeReturn13kg > 0 || transaction.swipeReturn50kg > 0

                console.log("Transaction sheet data check:", {
                  customerName,
                  maxGas6kgLoad: transaction.maxGas6kgLoad,
                  maxGas13kgLoad: transaction.maxGas13kgLoad,
                  maxGas50kgLoad: transaction.maxGas50kgLoad,
                  return6kg: transaction.return6kg,
                  return13kg: transaction.return13kg,
                  return50kg: transaction.return50kg,
                  swipeReturn6kg: transaction.swipeReturn6kg,
                  swipeReturn13kg: transaction.swipeReturn13kg,
                  swipeReturn50kg: transaction.swipeReturn50kg,
                  hasTransactionData
                })

                if (hasTransactionData) {
                  await addTransaction(transaction)
                  importedTransactions++
                  console.log("Transaction sheet data imported for customer:", customerName, "Date:", transactionDate)
                } else {
                  console.log("Skipping transaction sheet - no data for customer:", customerName)
                }

              } catch (error) {
                console.error("Error processing transaction sheet row:", error)
                errors.push(`Transaction row ${index + 2}: ${error.message}`)
              }
            }
          } else if (hasCustomerData && hasTransactionData) {
            console.log("Processing combined data sheet")
            // This is a combined sheet with both customer and transaction data
            for (let [index, row] of rows.entries()) {
              try {
                if (!row || row.length < 3) {
                  console.log("Skipping incomplete row:", row)
                  return
                }

                // Extract customer information
                const customerName = String(row[1] || "").trim()
                const customerPhone = String(row[2] || "").trim()
                const customerEmail = String(row[3] || "").trim()
                const customerAddress = String(row[4] || "").trim()

                if (!customerName || !customerPhone) {
                  console.log("Skipping row - missing customer name or phone:", row)
                  return
                }

                // Check if customer already exists (by name and phone)
                const customerKey = `${customerName}-${customerPhone}`
                let customerId

                if (customerMap.has(customerKey)) {
                  customerId = customerMap.get(customerKey)
                  console.log("Using existing customer ID:", customerId, "for:", customerName)
                } else {
                  // Create new customer
                  const newCustomer = {
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail,
                    address: customerAddress,
                  }
                  
                  addCustomer(newCustomer)
                  customerId = nextCustomerId++
                  customerMap.set(customerKey, customerId)
                  importedCustomers++
                  console.log("Created new customer:", customerName, "with ID:", customerId)
                }

                // Map the old customer ID from Excel to the new customer ID
                const oldCustomerId = parseInt(row[0]) || customerId
                customerIdMap.set(oldCustomerId, customerId)

                // Parse transaction date
                const transactionDate = parseDateFromDDMM(row[5])

                // Extract transaction data (adjust column indices based on your Excel structure)
                const transaction = {
                  customerId: customerId, // Use the new customer ID
                  date: transactionDate,
                  // Max gas loads - these are cylinders given to customer (loads)
                  maxGas6kgLoad: parseFloat(row[6]) || 0,
                  maxGas13kgLoad: parseFloat(row[7]) || 0,
                  maxGas50kgLoad: parseFloat(row[8]) || 0,
                  // Returns
                  return6kg: parseFloat(row[9]) || 0,
                  return13kg: parseFloat(row[10]) || 0,
                  return50kg: parseFloat(row[11]) || 0,
                  // Outright sales
                  outright6kg: parseFloat(row[12]) || 0,
                  outright13kg: parseFloat(row[13]) || 0,
                  outright50kg: parseFloat(row[14]) || 0,
                  // Swipe returns
                  swipeReturn6kg: parseFloat(row[15]) || 0,
                  swipeReturn13kg: parseFloat(row[16]) || 0,
                  swipeReturn50kg: parseFloat(row[17]) || 0,
                  // Prices
                  refillPrice6kg: parseFloat(row[18]) || 135,
                  refillPrice13kg: parseFloat(row[19]) || 135,
                  refillPrice50kg: parseFloat(row[20]) || 135,
                  outrightPrice6kg: parseFloat(row[21]) || 3200,
                  outrightPrice13kg: parseFloat(row[22]) || 3500,
                  outrightPrice50kg: parseFloat(row[23]) || 8500,
                  swipeRefillPrice6kg: parseFloat(row[24]) || 160,
                  swipeRefillPrice13kg: parseFloat(row[25]) || 160,
                  swipeRefillPrice50kg: parseFloat(row[26]) || 160,
                  paid: parseFloat(row[27]) || 0,
                  notes: String(row[28] || "").trim(),
                }

                // Only add transaction if there's actual transaction data
                const hasTransactionData = transaction.maxGas6kgLoad > 0 || transaction.maxGas13kgLoad > 0 || 
                                         transaction.maxGas50kgLoad > 0 || transaction.return6kg > 0 || 
                                         transaction.return13kg > 0 || transaction.return50kg > 0 ||
                                         transaction.outright6kg > 0 || transaction.outright13kg > 0 || 
                                         transaction.outright50kg > 0 || transaction.swipeReturn6kg > 0 || 
                                         transaction.swipeReturn13kg > 0 || transaction.swipeReturn50kg > 0

                if (hasTransactionData) {
                  await addTransaction(transaction)
                  importedTransactions++
                  console.log("Transaction imported for customer:", customerName)
                }

              } catch (error) {
                console.error("Error processing combined data row:", error)
                errors.push(`Row ${index + 2}: ${error.message}`)
              }
            }
          } else if (sheetName.toLowerCase() === "customers") {
            console.log("Processing customers sheet")
            // Import customers from dedicated customers sheet
            for (let [index, row] of rows.entries()) {
              try {
                if (!row || row.length < 3) {
                  console.log("Skipping incomplete customer row:", row)
                  return
                }
                
                const customer = {
                  name: String(row[1] || "").trim(),
                  phone: String(row[2] || "").trim(),
                  email: String(row[3] || "").trim(),
                  address: String(row[4] || "").trim(),
                }
                
                if (customer.name && customer.phone) {
                    const customerKey = `${customer.name}-${customer.phone}`
                    if (!customerMap.has(customerKey)) {
                  addCustomer(customer)
                      const newCustomerId = nextCustomerId++
                      customerMap.set(customerKey, newCustomerId)
                      
                      // Map the old customer ID from Excel to the new customer ID
                      const oldCustomerId = parseInt(row[0]) || newCustomerId
                      customerIdMap.set(oldCustomerId, newCustomerId)
                      
                  importedCustomers++
                      console.log("Customer imported:", customer.name, "ID:", oldCustomerId, "->", newCustomerId)
                    }
                }
              } catch (error) {
                console.error("Error processing customer row:", error)
                errors.push(`Customer row ${index + 2}: ${error.message}`)
              }
            }
          } else if (sheetName.toLowerCase() === "transactions") {
            console.log("Processing transactions sheet")
            // Import transactions from dedicated transactions sheet
            for (let [index, row] of rows.entries()) {
              try {
                if (!row || row.length < 5) {
                  console.log("Skipping incomplete transaction row:", row)
                  return
                }
                
                // Parse date
                const transactionDate = parseDateFromDDMM(row[3])
                
                const oldCustomerId = parseInt(row[1]) || 1
                const newCustomerId = customerIdMap.get(oldCustomerId) || oldCustomerId
                
                const transaction = {
                  customerId: newCustomerId,
                  date: transactionDate,
                  return6kg: parseFloat(row[4]) || 0,
                  return13kg: parseFloat(row[5]) || 0,
                  return50kg: parseFloat(row[6]) || 0,
                  outright6kg: parseFloat(row[7]) || 0,
                  outright13kg: parseFloat(row[8]) || 0,
                  outright50kg: parseFloat(row[9]) || 0,
                  swipeReturn6kg: parseFloat(row[10]) || 0,
                  swipeReturn13kg: parseFloat(row[11]) || 0,
                  swipeReturn50kg: parseFloat(row[12]) || 0,
                  refillPrice6kg: parseFloat(row[13]) || 135,
                  refillPrice13kg: parseFloat(row[14]) || 135,
                  refillPrice50kg: parseFloat(row[15]) || 135,
                  outrightPrice6kg: parseFloat(row[16]) || 3200,
                  outrightPrice13kg: parseFloat(row[17]) || 3500,
                  outrightPrice50kg: parseFloat(row[18]) || 8500,
                  swipeRefillPrice6kg: parseFloat(row[19]) || 160,
                  swipeRefillPrice13kg: parseFloat(row[20]) || 160,
                  swipeRefillPrice50kg: parseFloat(row[21]) || 160,
                  paid: parseFloat(row[22]) || 0,
                  notes: String(row[23] || "").trim(),
                }
                
                addTransaction(transaction)
                importedTransactions++
                console.log("Transaction imported:", transaction.id)
              } catch (error) {
                console.error("Error processing transaction row:", error)
                errors.push(`Transaction row ${index + 2}: ${error.message}`)
              }
            }
          } else {
            console.log("Skipping unknown sheet:", sheetName)
          }
        }
        
        console.log("Import completed. Customers:", importedCustomers, "Transactions:", importedTransactions)
        console.log("Customer map:", customerMap)
        console.log("Customer ID mapping:", customerIdMap)
        
        // Show results
        let message = `Import completed!\n\nImported: ${importedCustomers} customers, ${importedTransactions} transactions`
        if (customerMap.size > 0) {
          message += `\n\nCustomer merging: ${customerMap.size} unique customers identified`
        }
        if (customerIdMap.size > 0) {
          message += `\n\nCustomer ID mapping: ${customerIdMap.size} IDs mapped`
        }
        if (errors.length > 0) {
          message += `\n\nErrors (${errors.length}):\n${errors.slice(0, 5).join('\n')}`
          if (errors.length > 5) {
            message += `\n... and ${errors.length - 5} more errors`
          }
        }
        
        toast({ title: "Import Complete", description: message, variant: "success" })
        
        // Clear the file input
        e.target.value = ""
        
      } catch (error) {
        console.error("Import error:", error)
        setError("Import failed. Please check your file format. Error: " + error.message)
      } finally {
        setIsImporting(false)
      }
    }

    reader.onerror = (error) => {
      console.error("FileReader error:", error)
      setError("Failed to read file. Please try again.")
      setIsImporting(false)
    }

    reader.readAsArrayBuffer(file)
  }



  // Helper function to calculate transaction total (same as in store)
  const calculateTransactionTotal = (transaction) => {
    if (!transaction) return 0

    // MaxGas Refills (Returns) - Price is per kg
    const refill6kg = (transaction.return6kg || 0) * 6 * (transaction.refillPrice6kg || 135)
    const refill13kg = (transaction.return13kg || 0) * 13 * (transaction.refillPrice13kg || 135)
    const refill50kg = (transaction.return50kg || 0) * 50 * (transaction.refillPrice50kg || 135)

    // MaxGas Outright Sales (Full cylinders) - Price is per cylinder
    const outright6kg = (transaction.outright6kg || 0) * (transaction.outrightPrice6kg || 3200)
    const outright13kg = (transaction.outright13kg || 0) * (transaction.outrightPrice13kg || 3500)
    const outright50kg = (transaction.outright50kg || 0) * (transaction.outrightPrice50kg || 8500)

    // Other Company Swipes - Price is per kg
    const swipe6kg = (transaction.swipeReturn6kg || 0) * 6 * (transaction.swipeRefillPrice6kg || 160)
    const swipe13kg = (transaction.swipeReturn13kg || 0) * 13 * (transaction.swipeRefillPrice13kg || 160)
    const swipe50kg = (transaction.swipeReturn50kg || 0) * 50 * (transaction.swipeRefillPrice50kg || 160)

    return refill6kg + refill13kg + refill50kg + outright6kg + outright13kg + outright50kg + swipe6kg + swipe13kg + swipe50kg
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
              <p>• Combined Data worksheet with customers and transactions in one sheet</p>
              <p>• Customers worksheet with all customer details</p>
              <p>• Transactions worksheet with all transaction data including dates</p>
              <p>• Individual worksheets for each customer/employee</p>
              <p>• Summary worksheet with customer totals</p>
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

      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Upload className="w-16 h-16 mx-auto text-indigo-600" />
            <h3 className="text-xl font-bold mt-4">Import from Excel</h3>
            <p className="text-gray-600 mt-2 mb-4">
              Import customers and transactions from an Excel file
            </p>
            <div className="text-sm text-gray-500 mb-6 space-y-1">
              <p>• Supports combined data sheets with customers and transactions</p>
              <p>• Automatically merges customers with the same name and phone</p>
              <p>• Empty fields will be treated as 0</p>
              <p>• Date formats are automatically detected</p>
              <p>• Can import from separate Customers/Transactions sheets</p>
            </div>
            <div className="flex justify-center gap-3">
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
                  onClick={() => {
                    // Trigger file input click
                    document.getElementById('file-upload').click()
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? "Importing..." : "Import Data"}
                </Button>
              </label>

            </div>
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
                console.log("Customers:", customers.length)
                console.log("Transactions:", transactions.length)
                
                if (transactions.length > 0) {
                  console.log("Sample transaction:", transactions[0])
                }
                
                alert(`Current data: ${customers.length} customers, ${transactions.length} transactions. Check console for details.`)
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
