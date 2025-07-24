"use client"

import { useState, useEffect } from "react"
import { useStore } from "../lib/store"
import { useRBAC } from "../lib/rbac"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { ArrowLeft, PlusCircle, Trash2, FileText, DollarSign, Package, AlertTriangle, Shield, Settings } from "lucide-react"
import AddTransactionForm from "./add-transaction-form"
import EditCustomerForm from "./edit-customer-form"
import TransactionHistory from "./transaction-history" // The new, rebuilt component
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import ReceiptGenerator from "./receipt-generator"
import CustomerReportGenerator from "./customer-report-generator"
import EditTransactionForm from "./edit-transaction-form"
import { calculateTransactionTotal } from "../lib/calculations";
import BulkPaymentForm from "./bulk-payment-form"
import ConfirmationDialog from "./confirmation-dialog"

const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);

export default function EnhancedCustomerDetail({ customerId, onBack }) {
  const { customers, getCustomerTransactions, deleteCustomer, user } = useStore()
  const rbac = useRBAC(user)
  
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeleteOptions, setShowDeleteOptions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [editingTransaction, setEditingTransaction] = useState(null);

  const customer = customers.find((c) => c.id === customerId)
  const customerTransactions = getCustomerTransactions(customerId)

  if (!customer) {
    return (
      <div className="text-center p-8">
        <p>Customer not found. Please go back and select a customer.</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    )
  }

  // Live calculation for financial and cylinder balances
  const totalBill = customerTransactions.reduce((sum, t) => sum + calculateTransactionTotal(t), 0);
  const totalPaid = customerTransactions.reduce((sum, t) => sum + (parseFloat(t.amount_paid) || 0), 0);
  const financialBalance = totalBill - totalPaid;
  // Fix cylinder balance calculation to use correct logic: Load - (Returns + Outright)
  const cylinderBalance6kg = customerTransactions.reduce((sum, t) => {
    const load = t.load_6kg || 0;
    const returns = (t.returns_breakdown?.max_empty?.kg6 || 0) + (t.returns_breakdown?.swap_empty?.kg6 || 0) + (t.returns_breakdown?.return_full?.kg6 || 0);
    const outright = t.outright_breakdown?.kg6 || 0;
    return sum + (load - returns - outright);
  }, 0);
  const cylinderBalance13kg = customerTransactions.reduce((sum, t) => {
    const load = t.load_13kg || 0;
    const returns = (t.returns_breakdown?.max_empty?.kg13 || 0) + (t.returns_breakdown?.swap_empty?.kg13 || 0) + (t.returns_breakdown?.return_full?.kg13 || 0);
    const outright = t.outright_breakdown?.kg13 || 0;
    return sum + (load - returns - outright);
  }, 0);
  const cylinderBalance50kg = customerTransactions.reduce((sum, t) => {
    const load = t.load_50kg || 0;
    const returns = (t.returns_breakdown?.max_empty?.kg50 || 0) + (t.returns_breakdown?.swap_empty?.kg50 || 0) + (t.returns_breakdown?.return_full?.kg50 || 0);
    const outright = t.outright_breakdown?.kg50 || 0;
    return sum + (load - returns - outright);
  }, 0);
  const cylinderBalance = cylinderBalance6kg + cylinderBalance13kg + cylinderBalance50kg;

  const handleDeleteCustomer = async () => {
    setShowDeleteConfirm(true);
  }

  const confirmDeleteCustomer = async () => {
    try {
      setIsDeleting(true)
      await deleteCustomer(customerId)
      onBack() // Go back to the customer list after deletion
    } catch (error) {
      alert(`Failed to delete customer: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }
  
  if (isAddingTransaction) {
    return <AddTransactionForm customerId={customerId} customerName={customer.name} onBack={() => setIsAddingTransaction(false)} onSuccess={() => setIsAddingTransaction(false)} />
  }

  if (isEditingCustomer) {
    return <EditCustomerForm customer={customer} onBack={() => setIsEditingCustomer(false)} onSuccess={() => setIsEditingCustomer(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-25 to-white p-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">{customer.phone}</p>
            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full mt-1">
              {customer.category}
            </span>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            onClick={() => setIsEditingCustomer(true)}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Edit Customer
          </Button>
          <Button
            onClick={() => setIsAddingTransaction(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
          <Button
            onClick={() => setShowReport(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Total Billed</CardTitle>
              <DollarSign className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-700 mb-2">Ksh {formatNumber(totalBill || 0)}</div>
            <p className="text-lg text-orange-600 font-semibold">Total of All Transactions</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Total Paid</CardTitle>
              <DollarSign className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-700 mb-2">Ksh {formatNumber(totalPaid || 0)}</div>
            <p className="text-lg text-green-600 font-semibold">Payments Received</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Outstanding Balance</CardTitle>
              <DollarSign className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-red-700 mb-2">Ksh {formatNumber(financialBalance || 0)}</div>
            <p className="text-lg text-red-600 font-semibold">{financialBalance > 0 ? 'Amount Due' : 'Fully Paid'}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Cylinder Status</CardTitle>
              <Package className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className={`text-3xl font-bold mb-2 ${cylinderBalance > 0 ? 'text-red-700' : 'text-green-700'}`}>
              {cylinderBalance > 0 ? `+${cylinderBalance}` : (cylinderBalance || 0)}
            </div>
            <p className="text-lg font-semibold mb-4">
              {cylinderBalance > 0 ? 'Cylinders Owed to Us' : 'Cylinders Owed to Customer'}
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2 rounded border">
                <div className="font-bold">{cylinderBalance6kg || 0}</div>
                <div>6kg</div>
              </div>
              <div className="bg-white p-2 rounded border">
                <div className="font-bold">{cylinderBalance13kg || 0}</div>
                <div>13kg</div>
              </div>
              <div className="bg-white p-2 rounded border">
                <div className="font-bold">{cylinderBalance50kg || 0}</div>
                <div>50kg</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Payment Section */}
      {financialBalance > 0 && (
        <Card className="border border-gray-200 bg-white">
          <CardHeader className="bg-green-500 text-white">
            <CardTitle className="text-lg font-semibold">Record Payment</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <BulkPaymentForm 
              customerId={customerId} 
              customerName={customer.name} 
              outstandingAmount={financialBalance} 
            />
          </CardContent>
        </Card>
      )}

      
      {/* Transaction History */}
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="bg-orange-500 text-white">
          <CardTitle className="text-lg font-semibold">Transaction History</CardTitle>
          <CardDescription className="text-orange-100">A complete record of all transactions for this customer.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <TransactionHistory
            transactions={customerTransactions}
            customerId={customerId}
            onEdit={transaction => setEditingTransaction(transaction)}
            onViewReceipt={(transaction) => {
              setSelectedTransaction(transaction);
              setShowReceipt(true);
            }}
          />
        </CardContent>
      </Card>
      {editingTransaction && (
        <Dialog open={!!editingTransaction} onOpenChange={open => { if (!open) setEditingTransaction(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Edit Transaction</DialogTitle>
              <DialogDescription>Edit transaction details</DialogDescription>
            </DialogHeader>
            <EditTransactionForm
              transaction={editingTransaction}
              onBack={() => setEditingTransaction(null)}
              onSuccess={() => setEditingTransaction(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Advanced Actions */}
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="bg-orange-500 text-white">
          <CardTitle className="text-lg font-semibold">Advanced Actions</CardTitle>
          <CardDescription className="text-orange-100">Sensitive operations requiring administrator privileges.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!showDeleteOptions ? (
            <Button
              onClick={() => setShowDeleteOptions(true)}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Show Delete Options
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">Danger Zone</span>
                </div>
                <p className="text-sm text-red-700 mb-4">
                  This action cannot be undone. This will permanently delete the customer and all associated data.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeleteCustomer}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Customer'}
                  </Button>
                  <Button
                    onClick={() => setShowDeleteOptions(false)}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>
              Transaction receipt for {customer?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && <ReceiptGenerator transaction={selectedTransaction} customer={customer} />}
        </DialogContent>
      </Dialog>
      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Report</DialogTitle>
            <DialogDescription>
              Detailed report and analytics for {customer?.name}
            </DialogDescription>
          </DialogHeader>
          <CustomerReportGenerator customerId={customerId} customerName={customer.name} />
        </DialogContent>
      </Dialog>

      {/* Delete Customer Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDeleteCustomer}
        title="Delete Customer"
        description={`Are you sure you want to delete ${customer.name}? This action cannot be undone.`}
        confirmText="Delete Customer"
        type="customer"
        customerName={customer.name}
        transactionCount={customerTransactions?.length || 0}
        isDestructive={true}
      />
    </div>
  )
}
