"use client"

import { useRef } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { FileText, Download, Printer } from "lucide-react"
import { useStore } from "../lib/store"
import { formatCurrency, formatDate, calculateTransactionTotal } from "../lib/calculations"

export default function CustomerReportGenerator({ customerId, customerName }) {
  const { customers, transactions } = useStore()
  const reportRef = useRef(null)

  const customer = customers.find((c) => c.id === customerId)
  const customerTransactions = transactions
    .filter((t) => t.customerId === customerId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const totalSales = customerTransactions.reduce((sum, t) => sum + calculateTransactionTotal(t), 0)
  const totalPaid = customerTransactions.reduce((sum, t) => sum + (t.paid || 0), 0)
  const totalOutstanding = totalSales - totalPaid

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
              body { padding: 0; }
              .report { max-width: none; }
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
    <Card className="shadow-xl border-0 bg-white">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Customer Report
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={reportRef} className="p-6">
          {/* Header */}
          <div className="header">
            <div className="company-name">MaxGas</div>
            <div className="report-title">Customer Report</div>
            <div className="report-date">Generated on {formatDate(new Date())}</div>
          </div>

          {/* Summary */}
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-value">{formatCurrency(totalSales)}</div>
              <div className="summary-label">Total Sales</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{formatCurrency(totalPaid)}</div>
              <div className="summary-label">Total Paid</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{formatCurrency(totalOutstanding)}</div>
              <div className="summary-label">Outstanding</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{customerTransactions.length}</div>
              <div className="summary-label">Transactions</div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="customer-info">
            <h3 style={{ marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>Customer Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span>{customer.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="info-item">
                  <span className="info-label">Address:</span>
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Transactions */}
          <div>
            <h3 style={{ marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>Transaction History</h3>
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction #</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customerTransactions.map((transaction) => {
                  const total = calculateTransactionTotal(transaction)
                  const paid = transaction.paid || 0
                  const outstanding = total - paid
                  return (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.date)}</td>
                      <td>#{transaction.id}</td>
                      <td>{formatCurrency(total)}</td>
                      <td>{formatCurrency(paid)}</td>
                      <td>{formatCurrency(outstanding)}</td>
                      <td>
                        <span className={outstanding <= 0 ? "status-paid" : "status-outstanding"}>
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
      </CardContent>
    </Card>
  )
}
