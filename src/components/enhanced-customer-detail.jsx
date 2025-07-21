"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ArrowLeft, Plus, User, Phone, Mail, MapPin, Edit, Trash2, Receipt, FileText } from "lucide-react"
import { useStore } from "../lib/store"
import { useRBAC } from "../lib/rbac"
import { formatCurrency, calculateTransactionTotal, calculateOutstanding } from "../lib/calculations"
import { toast } from "../hooks/use-toast"
import AddTransactionForm from "./add-transaction-form"
import TransactionHistory from "./transaction-history"
import EditCustomerForm from "./edit-customer-form"
import BulkPaymentForm from "./bulk-payment-form"
import ReceiptGenerator from "./receipt-generator"
import CustomerReportGenerator from "./customer-report-generator"
import ConfirmationDialog from "./confirmation-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"

export default function EnhancedCustomerDetail({ customerId, onBack }) {
  const { customers, getCustomerTransactions, deleteCustomer, getCustomerCylinderBalance, submitApprovalRequest, user } = useStore()
  const { permissions } = useRBAC(user)
  const customerTransactions = getCustomerTransactions(customerId)
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

  // Safety check
  const safeCustomers = customers || []
  const customer = safeCustomers.find((c) => c.id === customerId)
  const cylinderBalance = getCustomerCylinderBalance(customerId)

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

  const handleDeleteCustomer = async () => {
    try {
      // If user is operator, submit approval request instead of direct delete
      if (permissions?.canRequestApproval && !permissions?.canDeleteCustomer) {
        const approvalData = {
          requestType: 'customer_delete',
          entityType: 'customer',
          entityId: customerId,
          reason: `Requesting to delete customer ${customer.name}`
        }

        await submitApprovalRequest(approvalData)
        
        toast({
          title: "Approval Request Submitted",
          description: "Your request has been sent to management for approval.",
        })
      } else {
        // Direct delete for managers and admins
        await deleteCustomer(customerId)
        
        toast({
          title: "Customer Deleted",
          description: `${customer.name} has been deleted successfully.`,
        })
      }
      
      onBack()
    } catch (error) {
      console.error('Failed to delete customer:', error)
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditSuccess = () => {
    setIsEditingCustomer(false)
  }

  const handlePrintReceipt = () => {
    if (customerTransactions.length > 0) {
      const sortedTransactions = [...customerTransactions].sort((a, b) => new Date(b.date) - new Date(a.date))
      // Safely access first transaction to prevent "customers is not defined" error
      setSelectedTransaction(sortedTransactions.length > 0 ? sortedTransactions[0] : null)
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

          {/* Cylinder Balance Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle>Cylinder Balance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    cylinderBalance['6kg'] > 0 ? 'bg-red-50 border border-red-200' : 
                    cylinderBalance['6kg'] < 0 ? 'bg-yellow-50 border border-yellow-200' : 
                    'bg-green-50 border border-green-200'
                  }`}>
                    <span className="font-medium text-gray-700">6kg Cylinders</span>
                    <span className={`text-lg font-bold ${
                      cylinderBalance['6kg'] > 0 ? 'text-red-600' : 
                      cylinderBalance['6kg'] < 0 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {cylinderBalance['6kg'] > 0 ? `+${cylinderBalance['6kg']}` : 
                       cylinderBalance['6kg'] < 0 ? `-${Math.abs(cylinderBalance['6kg'])}` : 
                       cylinderBalance['6kg']}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    cylinderBalance['13kg'] > 0 ? 'bg-red-50 border border-red-200' : 
                    cylinderBalance['13kg'] < 0 ? 'bg-yellow-50 border border-yellow-200' : 
                    'bg-green-50 border border-green-200'
                  }`}>
                    <span className="font-medium text-gray-700">13kg Cylinders</span>
                    <span className={`text-lg font-bold ${
                      cylinderBalance['13kg'] > 0 ? 'text-red-600' : 
                      cylinderBalance['13kg'] < 0 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {cylinderBalance['13kg'] > 0 ? `+${cylinderBalance['13kg']}` : 
                       cylinderBalance['13kg'] < 0 ? `-${Math.abs(cylinderBalance['13kg'])}` : 
                       cylinderBalance['13kg']}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    cylinderBalance['50kg'] > 0 ? 'bg-red-50 border border-red-200' : 
                    cylinderBalance['50kg'] < 0 ? 'bg-yellow-50 border border-yellow-200' : 
                    'bg-green-50 border border-green-200'
                  }`}>
                    <span className="font-medium text-gray-700">50kg Cylinders</span>
                    <span className={`text-lg font-bold ${
                      cylinderBalance['50kg'] > 0 ? 'text-red-600' : 
                      cylinderBalance['50kg'] < 0 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {cylinderBalance['50kg'] > 0 ? `+${cylinderBalance['50kg']}` : 
                       cylinderBalance['50kg'] < 0 ? `-${Math.abs(cylinderBalance['50kg'])}` : 
                       cylinderBalance['50kg']}
                    </span>
                  </div>
                </div>
                
                <div className="text-center pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {cylinderBalance['6kg'] > 0 || cylinderBalance['13kg'] > 0 || cylinderBalance['50kg'] > 0 ? 
                      "⚠️ Customer owes cylinders" : 
                      cylinderBalance['6kg'] < 0 || cylinderBalance['13kg'] < 0 || cylinderBalance['50kg'] < 0 ? 
                      "✅ You owe cylinders" : 
                      "✅ Balance settled"
                    }
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    + = Customer owes you (RED) | - = You owe customer (YELLOW) | 0 = Balance settled (GREEN)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Info Card (temporary) - Commented out since data is now working */}
          {/* <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-sm">
                  <h4 className="font-medium text-gray-700 mb-2">Transaction Data Check:</h4>
                  {customerTransactions.map((t, index) => (
                    <div key={t.id} className="mb-3 p-2 bg-gray-50 rounded text-xs">
                      <div className="font-medium">Transaction #{t.id} ({new Date(t.date).toLocaleDateString()})</div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>Loads 6kg: {t.maxGas6kgLoad || 0}</div>
                        <div>Loads 13kg: {t.maxGas13kgLoad || 0}</div>
                        <div>Loads 50kg: {t.maxGas50kgLoad || 0}</div>
                        <div>Returns 6kg: {t.return6kg || 0}</div>
                        <div>Returns 13kg: {t.return13kg || 0}</div>
                        <div>Returns 50kg: {t.return50kg || 0}</div>
                        <div>Swipes 6kg: {t.swipeReturn6kg || 0}</div>
                        <div>Swipes 13kg: {t.swipeReturn13kg || 0}</div>
                        <div>Swipes 50kg: {t.swipeReturn50kg || 0}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-2">Fix Missing Loads:</h4>
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        const { addMissingLoadData } = useStore.getState()
                        addMissingLoadData("1", {
                          maxGas6kgLoad: 226,
                          maxGas13kgLoad: 2,
                          maxGas50kgLoad: 0
                        })
                        addMissingLoadData("7", {
                          maxGas6kgLoad: 187,
                          maxGas13kgLoad: 22,
                          maxGas50kgLoad: 0
                        })
                        alert("Loads data added! Refresh the page to see updated balance.")
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Add Estimated Loads (Based on Returns + Swipes)
                    </Button>

                    <Button
                      onClick={() => {
                        const { addMissingLoadData } = useStore.getState()
                        const totalReturns6kg = customerTransactions.reduce((sum, t) => sum + (t.return6kg || 0), 0)
                        const totalSwipes6kg = customerTransactions.reduce((sum, t) => sum + (t.swipeReturn6kg || 0), 0)
                        const totalReturns13kg = customerTransactions.reduce((sum, t) => sum + (t.return13kg || 0), 0)
                        const totalSwipes13kg = customerTransactions.reduce((sum, t) => sum + (t.swipeReturn13kg || 0), 0)
                        
                        const loads6kg = totalReturns6kg + totalSwipes6kg + Math.abs(cylinderBalance['6kg'])
                        const loads13kg = totalReturns13kg + totalSwipes13kg + Math.abs(cylinderBalance['13kg'])
                        
                        const transaction1Ratio = 0.5
                        const transaction7Ratio = 0.5
                        
                        addMissingLoadData("1", {
                          maxGas6kgLoad: Math.round(loads6kg * transaction1Ratio),
                          maxGas13kgLoad: Math.round(loads13kg * transaction1Ratio),
                          maxGas50kgLoad: 0
                        })
                        addMissingLoadData("7", {
                          maxGas6kgLoad: Math.round(loads6kg * transaction7Ratio),
                          maxGas13kgLoad: Math.round(loads13kg * transaction7Ratio),
                          maxGas50kgLoad: 0
                        })
                        alert(`Loads data added! 6kg: ${loads6kg}, 13kg: ${loads13kg}. Refresh the page to see updated balance.`)
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Add Balanced Loads (To Zero Out Balance)
                    </Button>
                    
                    <div className="text-xs text-gray-500">
                      Option 1: Based on returns + swipes | Option 2: To balance current negative balance
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}

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
        </div>

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
