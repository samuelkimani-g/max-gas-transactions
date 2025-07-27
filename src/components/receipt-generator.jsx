"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Printer, Building } from "lucide-react"
import { formatCurrency, formatDate, calculateTransactionTotal } from "../lib/calculations"

export default function ReceiptGenerator({ transaction, customer }) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const receiptRef = useRef(null)

  // Fetch payment history for this transaction
  useEffect(() => {
    if (transaction?.id) {
      fetchPaymentHistory()
    }
  }, [transaction?.id])

  const fetchPaymentHistory = async () => {
    setLoadingPayments(true)
    try {
      const response = await fetch(`https://max-gas-backend.onrender.com/api/payments/transaction/${transaction.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const payments = await response.json()
        setPaymentHistory(payments)
        console.log('Payment history loaded:', payments)
      } else {
        console.error('Failed to fetch payment history:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch payment history:', error)
    } finally {
      setLoadingPayments(false)
    }
  }

  const handlePrint = () => {
    setIsPrinting(true)
    const content = receiptRef.current
    const printWindow = window.open("", "_blank")

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${customer?.name || "Customer"}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Courier New', monospace;
              line-height: 1.2;
              color: #000;
              background: #fff;
              width: 80mm;
              max-width: 80mm;
              margin: 0 auto;
              font-size: 10px;
            }
            
            .receipt {
              width: 100%;
              max-width: 80mm;
              background: white;
              padding: 5mm;
            }
            
            .header {
              text-align: center;
              border-bottom: 2px solid #f97316;
              padding-bottom: 3mm;
              margin-bottom: 3mm;
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              padding: 3mm;
              border-radius: 2mm;
            }
            
            .company-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 1mm;
              color: #f97316;
            }
            
            .company-tagline {
              font-size: 8px;
              margin-bottom: 2mm;
              color: #60a5fa;
            }
            
            .receipt-title {
              font-size: 10px;
              font-weight: bold;
              border: 2px solid #f97316;
              background: #f97316;
              color: white;
              padding: 1mm 2mm;
              display: inline-block;
              border-radius: 1mm;
            }
            
            .transaction-info {
              margin-bottom: 3mm;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
              font-size: 8px;
            }
            
            .info-label {
              font-weight: bold;
            }
            
            .serial-number {
              font-family: monospace;
              font-weight: bold;
              font-size: 9px;
              text-align: center;
              background: #60a5fa;
              color: white;
              padding: 1mm;
              margin: 2mm 0;
              border: 1px solid #2563eb;
              border-radius: 1mm;
            }
            
            .status-badge {
              display: inline-block;
              padding: 1mm 2mm;
              font-size: 8px;
              font-weight: bold;
              border: 1px solid #000;
            }
            
            .status-paid {
              background: #90EE90;
            }
            
            .status-partial {
              background: #FFD700;
            }
            
            .status-outstanding {
              background: #FFB6C1;
            }
            
            .section-title {
              font-size: 10px;
              font-weight: bold;
              margin: 3mm 0 2mm 0;
              border-bottom: 2px solid #f97316;
              padding-bottom: 1mm;
              color: #1e293b;
              background: #fef3e2;
              padding: 1mm 2mm;
              border-radius: 1mm;
            }
            
            .cylinder-summary {
              margin-bottom: 3mm;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
              font-size: 8px;
            }
            
            .items-section {
              margin-bottom: 3mm;
            }
            
            .item-group {
              margin-bottom: 2mm;
            }
            
            .group-title {
              font-size: 9px;
              font-weight: bold;
              margin-bottom: 1mm;
              color: #2563eb;
              border-bottom: 1px solid #60a5fa;
              padding-bottom: 1mm;
            }
            
            .item-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
              font-size: 8px;
            }
            
            .item-description {
              flex: 2;
            }
            
            .item-amount {
              flex: 1;
              text-align: right;
              font-weight: bold;
            }
            
            .payment-history {
              margin-bottom: 3mm;
            }
            
            .payment-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 7px;
              margin-bottom: 2mm;
            }
            
            .payment-table th,
            .payment-table td {
              border: 1px solid #000;
              padding: 1mm;
              text-align: left;
            }
            
            .payment-table th {
              background: #f0f0f0;
              font-weight: bold;
            }
            
            .totals-section {
              border-top: 2px solid #f97316;
              padding-top: 2mm;
              margin-bottom: 3mm;
              background: #fef3e2;
              padding: 2mm;
              border-radius: 1mm;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
              font-size: 9px;
            }
            
            .total-row.final {
              font-size: 11px;
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 1mm;
            }
            
            .footer {
              text-align: center;
              border-top: 2px solid #f97316;
              padding-top: 3mm;
              font-size: 8px;
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              padding: 3mm;
              border-radius: 2mm;
            }
            
            .footer-message {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 2mm;
            }
            
            .footer-contact {
              line-height: 1.3;
            }
            
            @media print {
              body { 
                margin: 0; 
                padding: 0;
                background: white !important;
                width: 80mm !important;
                max-width: 80mm !important;
              }
              .receipt { 
                box-shadow: none; 
                margin: 0;
                width: 80mm !important;
                max-width: 80mm !important;
                background: white !important;
              }
              .header {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
                color: white !important;
                border-bottom: 2px solid #f97316 !important;
              }
              .company-name {
                color: #f97316 !important;
              }
              .company-tagline {
                color: #60a5fa !important;
              }
              .receipt-title {
                background: #f97316 !important;
                color: white !important;
                border: 2px solid #f97316 !important;
              }
              .serial-number {
                background: #60a5fa !important;
                color: white !important;
                border: 1px solid #2563eb !important;
              }
              .status-paid {
                background: #90EE90 !important;
                color: black !important;
                border: 1px solid black !important;
              }
              .status-partial {
                background: #FFD700 !important;
                color: black !important;
                border: 1px solid black !important;
              }
              .status-outstanding {
                background: #FFB6C1 !important;
                color: black !important;
                border: 1px solid black !important;
              }
              .section-title {
                color: #1e293b !important;
                border-bottom: 2px solid #f97316 !important;
                background: #fef3e2 !important;
              }
              .group-title {
                color: #2563eb !important;
                border-bottom: 1px solid #60a5fa !important;
              }
              .item-description {
                color: black !important;
              }
              .item-amount {
                color: black !important;
              }
              .payment-table th {
                background: #f0f0f0 !important;
                color: black !important;
              }
              .payment-table td {
                color: black !important;
                border: 1px solid black !important;
              }
              .total-row {
                color: black !important;
              }
              .footer {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
                color: white !important;
                border-top: 2px solid #f97316 !important;
              }
              .footer-message {
                color: white !important;
              }
              .footer-contact {
                color: white !important;
              }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${content.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onfocus = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
    setIsPrinting(false)
  }

  if (!transaction || !customer) {
    return null
  }

  const total = calculateTransactionTotal(transaction)
  const paid = transaction.amount_paid || 0
  const outstanding = total - paid

  // Determine payment status
  const getPaymentStatus = () => {
    if (outstanding <= 0) return { text: "FULLY PAID", class: "status-paid" }
    if (paid > 0) return { text: "PARTIALLY PAID", class: "status-partial" }
    return { text: "OUTSTANDING", class: "status-outstanding" }
  }

  const paymentStatus = getPaymentStatus()

  // Calculate cylinder movements
  const getCylinderMovements = () => {
    const movements = {
      in: { maxEmpty: { kg6: 0, kg13: 0, kg50: 0 }, swapEmpty: { kg6: 0, kg13: 0, kg50: 0 }, returnFull: { kg6: 0, kg13: 0, kg50: 0 } },
      out: { refills: { kg6: 0, kg13: 0, kg50: 0 }, outright: { kg6: 0, kg13: 0, kg50: 0 } }
    }

    // Returns (IN)
    if (transaction.returns_breakdown?.max_empty) {
      movements.in.maxEmpty = transaction.returns_breakdown.max_empty
    }
    if (transaction.returns_breakdown?.swap_empty) {
      movements.in.swapEmpty = transaction.returns_breakdown.swap_empty
    }
    if (transaction.returns_breakdown?.return_full) {
      movements.in.returnFull = transaction.returns_breakdown.return_full
    }

    // Outright (OUT)
    if (transaction.outright_breakdown) {
      movements.out.outright = transaction.outright_breakdown
    }

    // Load (OUT) - what customer received
    if (transaction.load_breakdown) {
      movements.out.refills = transaction.load_breakdown
    }

    return movements
  }

  const cylinderMovements = getCylinderMovements()

  // Calculate total cylinders handled
  const totalIn = 
    (cylinderMovements.in.maxEmpty.kg6 || 0) + (cylinderMovements.in.maxEmpty.kg13 || 0) + (cylinderMovements.in.maxEmpty.kg50 || 0) +
    (cylinderMovements.in.swapEmpty.kg6 || 0) + (cylinderMovements.in.swapEmpty.kg13 || 0) + (cylinderMovements.in.swapEmpty.kg50 || 0) +
    (cylinderMovements.in.returnFull.kg6 || 0) + (cylinderMovements.in.returnFull.kg13 || 0) + (cylinderMovements.in.returnFull.kg50 || 0)

  const totalOut = 
    (cylinderMovements.out.refills.kg6 || 0) + (cylinderMovements.out.refills.kg13 || 0) + (cylinderMovements.out.refills.kg50 || 0) +
    (cylinderMovements.out.outright.kg6 || 0) + (cylinderMovements.out.outright.kg13 || 0) + (cylinderMovements.out.outright.kg50 || 0)

  // Calculate items and services
  const maxGasReturns = []
  const maxGasOutright = []

  // Returns Breakdown - Fixed calculation with kg multiplication
  if (transaction.returns_breakdown?.max_empty) {
    if (transaction.returns_breakdown.max_empty.kg6 > 0) {
      const price = transaction.returns_breakdown.max_empty.price6 || 135
      maxGasReturns.push({ 
        description: `6kg Max Empty Swap Fee (${transaction.returns_breakdown.max_empty.kg6} units @ KES ${price}/unit)`, 
        amount: transaction.returns_breakdown.max_empty.kg6 * price * 6 
      })
    }
    if (transaction.returns_breakdown.max_empty.kg13 > 0) {
      const price = transaction.returns_breakdown.max_empty.price13 || 135
      maxGasReturns.push({ 
        description: `13kg Max Empty Swap Fee (${transaction.returns_breakdown.max_empty.kg13} units @ KES ${price}/unit)`, 
        amount: transaction.returns_breakdown.max_empty.kg13 * price * 13 
      })
    }
    if (transaction.returns_breakdown.max_empty.kg50 > 0) {
      const price = transaction.returns_breakdown.max_empty.price50 || 135
      maxGasReturns.push({ 
        description: `50kg Max Empty Swap Fee (${transaction.returns_breakdown.max_empty.kg50} units @ KES ${price}/unit)`, 
        amount: transaction.returns_breakdown.max_empty.kg50 * price * 50 
      })
    }
  }

  if (transaction.returns_breakdown?.swap_empty) {
    if (transaction.returns_breakdown.swap_empty.kg6 > 0) {
      const price = transaction.returns_breakdown.swap_empty.price6 || 160
      maxGasReturns.push({ 
        description: `6kg Swap Empty Fee (${transaction.returns_breakdown.swap_empty.kg6} units @ KES ${price}/unit)`, 
        amount: transaction.returns_breakdown.swap_empty.kg6 * price * 6 
      })
    }
    if (transaction.returns_breakdown.swap_empty.kg13 > 0) {
      const price = transaction.returns_breakdown.swap_empty.price13 || 160
      maxGasReturns.push({ 
        description: `13kg Swap Empty Fee (${transaction.returns_breakdown.swap_empty.kg13} units @ KES ${price}/unit)`, 
        amount: transaction.returns_breakdown.swap_empty.kg13 * price * 13 
      })
    }
    if (transaction.returns_breakdown.swap_empty.kg50 > 0) {
      const price = transaction.returns_breakdown.swap_empty.price50 || 160
      maxGasReturns.push({ 
        description: `50kg Swap Empty Fee (${transaction.returns_breakdown.swap_empty.kg50} units @ KES ${price}/unit)`, 
        amount: transaction.returns_breakdown.swap_empty.kg50 * price * 50 
      })
    }
  }

  // Outright Breakdown
  if (transaction.outright_breakdown) {
    if (transaction.outright_breakdown.kg6 > 0) {
      const price = transaction.outright_breakdown.price6 || 2200
      maxGasOutright.push({ 
        description: `6kg Outright Sale (${transaction.outright_breakdown.kg6} units @ KES ${price}/unit)`, 
        amount: transaction.outright_breakdown.kg6 * price 
      })
    }
    if (transaction.outright_breakdown.kg13 > 0) {
      const price = transaction.outright_breakdown.price13 || 4400
      maxGasOutright.push({ 
        description: `13kg Outright Sale (${transaction.outright_breakdown.kg13} units @ KES ${price}/unit)`, 
        amount: transaction.outright_breakdown.kg13 * price 
      })
    }
    if (transaction.outright_breakdown.kg50 > 0) {
      const price = transaction.outright_breakdown.price50 || 8000
      maxGasOutright.push({ 
        description: `50kg Outright Sale (${transaction.outright_breakdown.kg50} units @ KES ${price}/unit)`, 
        amount: transaction.outright_breakdown.kg50 * price 
      })
    }
  }

  const totalOutrightAmount = maxGasOutright.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end">
        <Button
          onClick={handlePrint}
          disabled={isPrinting}
          variant="outline"
          size="sm"
        >
          <Printer className="w-4 h-4 mr-1" />
          Print
        </Button>
      </div>

      {/* Receipt Content */}
      <div ref={receiptRef} className="bg-white rounded-lg border max-w-md mx-auto overflow-hidden">
        {/* Header */}
        <div className="text-center border-b-2 border-orange-500 p-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
          <div className="text-lg font-bold text-orange-400">MaxGas</div>
          <div className="text-sm text-blue-300">Premium Gas Cylinder Solutions</div>
          <div className="text-xs font-semibold bg-orange-500 text-white border-2 border-orange-500 px-2 py-1 mt-2 inline-block rounded">OFFICIAL RECEIPT</div>
        </div>

        {/* Transaction Info */}
        <div className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold">Transaction Serial:</span>
            <span className="font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs">{transaction.transaction_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Receipt #:</span>
            <span>#{transaction.id.toString().padStart(6, "0")}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Date:</span>
            <span>{formatDate(transaction.date || new Date())}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Customer:</span>
            <span>{customer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Phone:</span>
            <span>{customer.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Status:</span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              paymentStatus.text === 'FULLY PAID' ? 'bg-green-100 text-green-800' :
              paymentStatus.text === 'PARTIALLY PAID' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>{paymentStatus.text}</span>
          </div>
        </div>

        {/* Cylinder Movements Summary */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm font-bold text-gray-800 border-b-2 border-orange-500 bg-orange-50 p-2 rounded mb-3">Cylinder Movements Summary</div>
          <div className="text-xs mb-1">
            <span className="font-semibold">IN (Customer Returns):</span>
          </div>
          <div className="text-xs mb-1 ml-2">
            <span>  - Max Empty: 6kg ({cylinderMovements.in.maxEmpty.kg6 || 0}), 13kg ({cylinderMovements.in.maxEmpty.kg13 || 0}), 50kg ({cylinderMovements.in.maxEmpty.kg50 || 0})</span>
          </div>
          <div className="text-xs mb-1 ml-2">
            <span>  - Swap Empty: 6kg ({cylinderMovements.in.swapEmpty.kg6 || 0}), 13kg ({cylinderMovements.in.swapEmpty.kg13 || 0}), 50kg ({cylinderMovements.in.swapEmpty.kg50 || 0})</span>
          </div>
          <div className="text-xs mb-1 ml-2">
            <span>  - Return Full: 6kg ({cylinderMovements.in.returnFull.kg6 || 0}), 13kg ({cylinderMovements.in.returnFull.kg13 || 0}), 50kg ({cylinderMovements.in.returnFull.kg50 || 0})</span>
          </div>
          <div className="text-xs mb-1">
            <span className="font-semibold">OUT (Customer Received):</span>
          </div>
          <div className="text-xs mb-1 ml-2">
            <span>  - Refills: 6kg ({cylinderMovements.out.refills.kg6 || 0}), 13kg ({cylinderMovements.out.refills.kg13 || 0}), 50kg ({cylinderMovements.out.refills.kg50 || 0})</span>
          </div>
          <div className="text-xs mb-1 ml-2">
            <span>  - Outright: 6kg ({cylinderMovements.out.outright.kg6 || 0}), 13kg ({cylinderMovements.out.outright.kg13 || 0}), 50kg ({cylinderMovements.out.outright.kg50 || 0})</span>
          </div>
          <div className="text-xs mb-1">
            <span className="font-semibold">Load Total: {totalOut} cylinders</span>
          </div>
        </div>

        {/* Items & Services Breakdown */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm font-bold text-gray-800 border-b-2 border-orange-500 bg-orange-50 p-2 rounded mb-3">Items & Services Breakdown</div>
          
                      {maxGasReturns.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-blue-600 border-b border-blue-300 pb-1 mb-2">MaxGas Refills</div>
                              {maxGasReturns.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs mb-1">
                    <span className="flex-2">{item.description}</span>
                    <span className="flex-1 text-right font-bold">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
            </div>
          )}

                      {maxGasOutright.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-blue-600 border-b border-blue-300 pb-1 mb-2">MaxGas Outright Sales</div>
              {maxGasOutright.map((item, index) => (
                <div key={index} className="flex justify-between text-xs mb-1">
                  <span className="flex-2">{item.description}</span>
                  <span className="flex-1 text-right font-bold">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs mb-1">
                <span className="flex-2">(Total for outright sales: {formatCurrency(totalOutrightAmount)})</span>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Summary */}
        <div className="p-4 border-t border-gray-200 bg-orange-50 rounded">
          <div className="text-sm font-bold text-gray-800 border-b-2 border-orange-500 p-2 rounded mb-3">Transaction Summary</div>
          <div className="flex justify-between text-xs mb-1">
            <span>Subtotal:</span>
            <span className="font-bold">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span>Less: Discounts / Credits:</span>
            <span className="font-bold">{formatCurrency(0)}</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span>Plus: Taxes:</span>
            <span className="font-bold">{formatCurrency(0)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-2 mt-2">
            <span>TOTAL BILL:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm font-bold text-gray-800 border-b-2 border-orange-500 bg-orange-50 p-2 rounded mb-3">Payment Details</div>
          <div className="text-xs mb-2">
            <span>Payment History for Transaction #{transaction.transaction_number}:</span>
          </div>
          
          {loadingPayments ? (
            <div className="summary-row">
              <span>Loading payment history...</span>
            </div>
          ) : paymentHistory.length > 0 ? (
            <table className="w-full border-collapse text-xs mb-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1 text-left font-bold">Date & Time</th>
                  <th className="border border-gray-300 p-1 text-left font-bold">Amount Paid</th>
                  <th className="border border-gray-300 p-1 text-left font-bold">Method</th>
                  <th className="border border-gray-300 p-1 text-left font-bold">Reference</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-1">{formatDate(payment.paymentDate)}</td>
                    <td className="border border-gray-300 p-1 font-bold">{formatCurrency(parseFloat(payment.amount) || 0)}</td>
                    <td className="border border-gray-300 p-1">{payment.paymentMethod}</td>
                    <td className="border border-gray-300 p-1">{payment.reference || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="summary-row">
              <span>No payment history available</span>
            </div>
          )}
          
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold">Total Amount Paid to Date:</span>
            <span className="font-bold text-green-600">{formatCurrency(paid)}</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold">Outstanding Balance:</span>
            <span className="font-bold text-red-600">{formatCurrency(outstanding)}</span>
          </div>
        </div>

        {/* Notes */}
        {transaction.notes && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-sm font-bold text-gray-800 border-b-2 border-orange-500 bg-orange-50 p-2 rounded mb-3">Notes & Footer</div>
            <div className="text-xs">
              <span>Notes: {transaction.notes}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center border-t-2 border-orange-500 p-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
          <div className="text-sm font-bold mb-3">Thank you for your business!</div>
          <div className="text-xs">
            <div>MaxGas - Premium Gas Cylinder Solutions</div>
            <div>📧 info@maxgas.co.ke | 📞 +254 700 000 000</div>
            <div>🌐 www.maxgas.co.ke</div>
          </div>
        </div>
      </div>
    </div>
  )
}
