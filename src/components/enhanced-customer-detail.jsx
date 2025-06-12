"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ArrowLeft, Plus, User, Phone, Mail, MapPin, Edit, Trash2, Receipt, FileText } from "lucide-react"
import { useStore } from "../lib/store"
import { formatCurrency, calculateTransactionTotal, calculateOutstanding } from "../lib/calculations"
import AddTransactionForm from "./add-transaction-form"
import TransactionHistory from "./transaction-history"
import EditCustomerForm from "./edit-customer-form"
import BulkPaymentForm from "./bulk-payment-form"
import ReceiptGenerator from "./receipt-generator"
import CustomerReportGenerator from "./customer-report-generator"
import ConfirmationDialog from "./confirmation-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"

export default function EnhancedCustomerDetail({ customerId, onBack }) {
  const { customers, transactions, deleteCustomer } = useStore()
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  const customer = customers.find((c) => c.id === customerId)
  const customerTransactions = transactions.filter((t) => t.customerId === customerId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">Loading customer details...</h2>
          </div>
        </div>
      </div>
    )
  }

  const outstandingAmount = customerTransactions.reduce((total, transaction) => {
    const outstanding = calculateOutstanding(transaction)
    return total + outstanding
  }, 0)

  const handleDeleteCustomer = () => {
    deleteCustomer(customerId)
    onBack()
  }

  const handleEditSuccess = () => {
    setIsEditingCustomer(false)
  }

  const handlePrintReceipt = () => {
    if (customerTransactions.length > 0) {
      const sortedTransactions = [...customerTransactions].sort((a, b) => new Date(b.date) - new Date(a.date))
      setSelectedTransaction(sortedTransactions[0])
      setShowReceipt(true)
    }
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button onClick={onBack} variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Customer not found</h2>
          </div>
        </div>
      </div>
    )
  }

  if (isAddingTransaction) {
    return (
      <AddTransactionForm
        customerId={customerId}
        customerName={customer.name}
        onBack={() => setIsAddingTransaction(false)}
        onSuccess={() => setIsAddingTransaction(false)}
      />
    )
  }

  if (isEditingCustomer) {
    return (
      <EditCustomerForm customer={customer} onBack={() => setIsEditingCustomer(false)} onSuccess={handleEditSuccess} />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Button onClick={onBack} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Customer Info Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Info
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsEditingCustomer(true)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold">{customer.name}</h2>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {customer.phone}
                  </div>
                  {customer.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {customer.email}
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {customer.address}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outstanding Balance Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle>Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${outstandingAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(outstandingAmount)}
                </div>
                <p className="text-gray-600 mt-2">{outstandingAmount > 0 ? "Amount due" : "All payments up to date"}</p>

                {outstandingAmount > 0 && (
                  <div className="mt-4">
                    <BulkPaymentForm
                      customerId={customerId}
                      customerName={customer.name}
                      outstandingAmount={outstandingAmount}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button
                onClick={() => setIsAddingTransaction(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={handlePrintReceipt}
                disabled={customerTransactions.length === 0}
              >
                <Receipt className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>

              <Button variant="outline" className="w-full" onClick={() => setShowReport(true)}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          {/* Summary Stats Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Transactions</span>
                  <span className="font-semibold">{customerTransactions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sales</span>
                  <span className="font-semibold">
                    {formatCurrency(customerTransactions.reduce((total, t) => total + calculateTransactionTotal(t), 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Paid</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(customerTransactions.reduce((total, t) => total + (t.paid || 0), 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle>Transaction History ({customerTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <TransactionHistory
              customerId={customerId}
              onViewReceipt={(transaction) => {
                setSelectedTransaction(transaction)
                setShowReceipt(true)
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          {selectedTransaction && <ReceiptGenerator transaction={selectedTransaction} customer={customer} />}
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Report</DialogTitle>
          </DialogHeader>
          <CustomerReportGenerator customerId={customerId} customerName={customer.name} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customer.name}? This will permanently remove the customer and all their transactions. This action cannot be undone.`}
        type="danger"
        confirmText="Delete Customer"
        cancelText="Cancel"
      />
    </div>
  )
}
