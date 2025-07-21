"use client"

import { useState, useEffect } from "react"
import { useStore } from "../lib/store"
import { useRBAC } from "../lib/rbac"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { ArrowLeft, PlusCircle, Trash2, FileText, DollarSign, Package, AlertTriangle, Shield } from "lucide-react"
import AddTransactionForm from "./add-transaction-form"
import EditCustomerForm from "./edit-customer-form"
import TransactionHistory from "./transaction-history" // The new, rebuilt component
import { Badge } from "./ui/badge"

const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);

export default function EnhancedCustomerDetail({ customerId, onBack }) {
  const { customers, getCustomerTransactions, deleteCustomer, user } = useStore()
  const rbac = useRBAC(user)
  
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

  const handleDeleteCustomer = async () => {
    if (confirm(`Are you sure you want to PERMANENTLY DELETE ${customer.name}? This action cannot be undone.`)) {
      try {
        await deleteCustomer(customerId)
        onBack() // Go back to the customer list after deletion
      } catch (error) {
        alert(`Failed to delete customer: ${error.message}`)
      }
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
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-orange-900">{customer.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-orange-600 text-lg font-medium">{customer.phone}</p>
              {customer.email && (
                <>
                  <span className="text-orange-400">|</span>
                  <p className="text-orange-600 text-lg">{customer.email}</p>
                </>
              )}
              <Badge className="bg-orange-100 text-orange-800 border-orange-200">{customer.category}</Badge>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          {rbac?.permissions?.canEditCustomer && (
            <Button onClick={() => setIsEditingCustomer(true)} className="bg-orange-600 hover:bg-orange-700 text-white">
              Edit Customer
            </Button>
          )}
          {rbac?.permissions?.canAddTransaction && (
            <Button onClick={() => setIsAddingTransaction(true)} className="bg-green-600 hover:bg-green-700 text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Transaction
            </Button>
          )}
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg border-orange-200 bg-gradient-to-br from-white to-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-orange-800">Financial Balance</CardTitle>
            <DollarSign className="h-6 w-6 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${customer.financial_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              Ksh {formatNumber(customer.financial_balance || 0)}
            </div>
            <p className="text-sm text-orange-600 mt-1">
              {customer.financial_balance > 0 ? 'Owed to us' : 'Customer Credit'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-orange-200 bg-gradient-to-br from-white to-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-orange-800">Cylinder Balance</CardTitle>
            <Package className="h-6 w-6 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${customer.cylinder_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {customer.cylinder_balance > 0 ? `+${customer.cylinder_balance}`: (customer.cylinder_balance || 0)}
            </div>
            <p className="text-sm text-orange-600 mt-1">
               {customer.cylinder_balance > 0 ? 'Cylinders Owed to us' : 'Cylinders Owed to Customer'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Transaction History */}
      <Card className="shadow-lg border-orange-200 bg-gradient-to-br from-white to-orange-50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-orange-900">Transaction History</CardTitle>
          <CardDescription className="text-orange-600">A complete record of all transactions for this customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionHistory transactions={customerTransactions} customerId={customerId} />
        </CardContent>
      </Card>

      {/* Advanced Actions - Only show if admin */}
      {rbac?.permissions?.canDeleteCustomer && (
        <Card className="shadow-lg border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Advanced Actions
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sensitive operations requiring administrator privileges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(true)}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <Shield className="w-4 h-4 mr-2" />
                Show Delete Options
              </Button>
            ) : (
              <div className="space-y-4 p-4 border-2 border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <h4 className="font-semibold">Danger Zone</h4>
                </div>
                <p className="text-red-700 text-sm">
                  Permanently delete this customer and all their associated data. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteCustomer}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Confirm Delete
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="border-gray-300 text-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
