"use client"

import { useState, useRef } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Printer, Building2 } from "lucide-react"
import { formatCurrency, formatDate, calculateTransactionTotal } from "../lib/calculations"

export default function ReceiptGenerator({ transaction, customer }) {
  const [isPrinting, setIsPrinting] = useState(false)
  const receiptRef = useRef(null)

  const handlePrint = () => {
    setIsPrinting(true)
    const content = receiptRef.current
    const printWindow = window.open("", "_blank")

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${customer?.name || "Customer"}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #2d3748;
              background: #f7fafc;
              padding: 20px;
            }
            
            .receipt {
              max-width: 420px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              position: relative;
            }
            
            .receipt::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #f97316, #ea580c, #dc2626);
            }
            
            .header {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              padding: 32px 24px;
              text-align: center;
              position: relative;
            }
            
            .header::after {
              content: '';
              position: absolute;
              bottom: -20px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 20px solid transparent;
              border-right: 20px solid transparent;
              border-top: 20px solid #334155;
            }
            
            .company-logo {
              font-size: 32px;
              font-weight: 800;
              margin-bottom: 8px;
              letter-spacing: -1px;
            }
            
            .company-tagline {
              font-size: 14px;
              opacity: 0.9;
              margin-bottom: 16px;
              font-weight: 300;
            }
            
            .receipt-title {
              background: rgba(249, 115, 22, 0.2);
              color: #f97316;
              padding: 8px 20px;
              border-radius: 25px;
              font-size: 14px;
              font-weight: 600;
              letter-spacing: 1px;
              display: inline-block;
              border: 1px solid rgba(249, 115, 22, 0.3);
            }
            
            .receipt-body {
              padding: 32px 24px 24px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 32px;
            }
            
            .info-card {
              background: #f8fafc;
              padding: 16px;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
            }
            
            .info-card.customer {
              grid-column: 1 / -1;
              background: linear-gradient(135deg, #fef3e2 0%, #fed7aa 100%);
              border: 1px solid #fdba74;
            }
            
            .info-label {
              font-size: 12px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            
            .info-value {
              font-size: 14px;
              font-weight: 600;
              color: #1e293b;
            }
            
            .status-badge {
              display: inline-flex;
              align-items: center;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .status-paid {
              background: #dcfce7;
              color: #166534;
              border: 1px solid #bbf7d0;
            }
            
            .status-outstanding {
              background: #fef2f2;
              color: #991b1b;
              border: 1px solid #fecaca;
            }
            
            .items-section {
              margin-bottom: 32px;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              padding-bottom: 12px;
              border-bottom: 2px solid #f1f5f9;
            }
            
            .section-icon {
              width: 32px;
              height: 32px;
              background: linear-gradient(135deg, #f97316, #ea580c);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 12px;
              font-size: 16px;
            }
            
            .item-group {
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 16px;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }
            
            .item-group:last-child {
              margin-bottom: 0;
            }
            
            .item-group-title {
              font-weight: 700;
              color: #374151;
              font-size: 14px;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding-bottom: 8px;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .item-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px dotted #d1d5db;
            }
            
            .item-row:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }
            
            .item-description {
              color: #4b5563;
              font-size: 14px;
              font-weight: 500;
            }
            
            .item-amount {
              font-weight: 700;
              color: #1f2937;
              font-size: 14px;
            }
            
            .totals-section {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 24px;
              border-radius: 16px;
              margin-bottom: 32px;
              border: 1px solid #e2e8f0;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              font-size: 16px;
            }
            
            .total-row:last-child {
              margin-bottom: 0;
              padding-top: 16px;
              border-top: 2px solid #cbd5e1;
              font-size: 20px;
              font-weight: 800;
            }
            
            .total-label {
              color: #4b5563;
              font-weight: 600;
            }
            
            .total-amount {
              font-weight: 700;
            }
            
            .total-amount.positive {
              color: #059669;
            }
            
            .total-amount.negative {
              color: #dc2626;
            }
            
            .footer {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              text-align: center;
              padding: 32px 24px;
            }
            
            .footer-message {
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            
            .footer-company {
              font-size: 16px;
              margin-bottom: 20px;
              opacity: 0.9;
            }
            
            .footer-contact {
              font-size: 13px;
              opacity: 0.8;
              line-height: 1.6;
            }
            
            .qr-placeholder {
              width: 80px;
              height: 80px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              margin: 20px auto 0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            @media print {
              body { 
                margin: 0; 
                padding: 0;
                background: white;
              }
              .receipt { 
                box-shadow: none; 
                margin: 0;
                max-width: none;
                border-radius: 0;
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
  const paid = transaction.paid || 0
  const outstanding = total - paid

  // Group items by type
  const maxGasReturns = []
  const maxGasOutright = []
  const otherCompanySwipes = []

  if (transaction.return6kg > 0) {
    maxGasReturns.push({
      description: `6kg Refill × ${transaction.return6kg}`,
      amount: transaction.return6kg * (transaction.refillPrice6kg || 0),
    })
  }
  if (transaction.return13kg > 0) {
    maxGasReturns.push({
      description: `13kg Refill × ${transaction.return13kg}`,
      amount: transaction.return13kg * (transaction.refillPrice13kg || 0),
    })
  }
  if (transaction.return50kg > 0) {
    maxGasReturns.push({
      description: `50kg Refill × ${transaction.return50kg}`,
      amount: transaction.return50kg * (transaction.refillPrice50kg || 0),
    })
  }

  if (transaction.outright6kg > 0) {
    maxGasOutright.push({
      description: `6kg Outright × ${transaction.outright6kg}`,
      amount: transaction.outright6kg * (transaction.outrightPrice6kg || 0),
    })
  }
  if (transaction.outright13kg > 0) {
    maxGasOutright.push({
      description: `13kg Outright × ${transaction.outright13kg}`,
      amount: transaction.outright13kg * (transaction.outrightPrice13kg || 0),
    })
  }
  if (transaction.outright50kg > 0) {
    maxGasOutright.push({
      description: `50kg Outright × ${transaction.outright50kg}`,
      amount: transaction.outright50kg * (transaction.outrightPrice50kg || 0),
    })
  }

  if (transaction.swipeReturn6kg > 0) {
    otherCompanySwipes.push({
      description: `6kg Swipe × ${transaction.swipeReturn6kg}`,
      amount: transaction.swipeReturn6kg * (transaction.swipeRefillPrice6kg || 0),
    })
  }
  if (transaction.swipeReturn13kg > 0) {
    otherCompanySwipes.push({
      description: `13kg Swipe × ${transaction.swipeReturn13kg}`,
      amount: transaction.swipeReturn13kg * (transaction.swipeRefillPrice13kg || 0),
    })
  }
  if (transaction.swipeReturn50kg > 0) {
    otherCompanySwipes.push({
      description: `50kg Swipe × ${transaction.swipeReturn50kg}`,
      amount: transaction.swipeReturn50kg * (transaction.swipeRefillPrice50kg || 0),
    })
  }

  return (
    <Card className="shadow-xl border-0 bg-white max-w-md mx-auto">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Receipt
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={receiptRef} className="print-area bg-white">
          {/* Header */}
          <div className="header">
            <div className="company-logo">MaxGas</div>
            <div className="company-tagline">Premium Gas Cylinder Solutions</div>
            <div className="receipt-title">OFFICIAL RECEIPT</div>
          </div>

          {/* Receipt Body */}
          <div className="receipt-body">
            {/* Info Grid */}
            <div className="info-grid">
              <div className="info-card">
                <div className="info-label">Receipt #</div>
                <div className="info-value">#{transaction.id.toString().padStart(6, "0")}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Date</div>
                <div className="info-value">{formatDate(transaction.date || new Date())}</div>
              </div>
              <div className="info-card customer">
                <div className="info-label">Customer</div>
                <div className="info-value">{customer.name}</div>
                <div className="info-label" style={{ marginTop: "8px" }}>
                  Phone
                </div>
                <div className="info-value">{customer.phone}</div>
                <div style={{ marginTop: "12px" }}>
                  <span className={`status-badge ${outstanding <= 0 ? "status-paid" : "status-outstanding"}`}>
                    {outstanding <= 0 ? "✓ Paid" : "⚠ Outstanding"}
                  </span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="items-section">
              <div className="section-title">
                <span className="section-icon">📦</span>
                Items & Services
              </div>

              {maxGasReturns.length > 0 && (
                <div className="item-group">
                  <div className="item-group-title">MaxGas Refills</div>
                  {maxGasReturns.map((item, index) => (
                    <div key={index} className="item-row">
                      <span className="item-description">{item.description}</span>
                      <span className="item-amount">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {maxGasOutright.length > 0 && (
                <div className="item-group">
                  <div className="item-group-title">MaxGas Outright Sales</div>
                  {maxGasOutright.map((item, index) => (
                    <div key={index} className="item-row">
                      <span className="item-description">{item.description}</span>
                      <span className="item-amount">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {otherCompanySwipes.length > 0 && (
                <div className="item-group">
                  <div className="item-group-title">Other Company Swipes</div>
                  {otherCompanySwipes.map((item, index) => (
                    <div key={index} className="item-row">
                      <span className="item-description">{item.description}</span>
                      <span className="item-amount">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="totals-section">
              <div className="total-row">
                <span className="total-label">Subtotal:</span>
                <span className="total-amount">{formatCurrency(total)}</span>
              </div>
              <div className="total-row">
                <span className="total-label">Amount Paid:</span>
                <span className="total-amount positive">{formatCurrency(paid)}</span>
              </div>
              <div className="total-row">
                <span className="total-label">Outstanding:</span>
                <span className={`total-amount ${outstanding > 0 ? "negative" : "positive"}`}>
                  {formatCurrency(outstanding)}
                </span>
              </div>
            </div>

            {transaction.notes && (
              <div className="info-card" style={{ marginBottom: "32px" }}>
                <div className="info-label">Notes</div>
                <div style={{ marginTop: "8px", fontSize: "14px", color: "#4b5563" }}>{transaction.notes}</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="footer">
            <div className="footer-message">Thank you for your business!</div>
            <div className="footer-company">MaxGas - Premium Gas Cylinder Solutions</div>
            <div className="footer-contact">
              📧 info@maxgas.co.ke | 📞 +254 700 000 000
              <br />🌐 www.maxgas.co.ke
            </div>
            <div className="qr-placeholder">QR Code</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
