"use client"

import { useState, useEffect } from "react"
import { useStore } from "../lib/store"
import { useRBAC } from "../lib/rbac"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { ArrowLeft, PlusCircle, Trash2, FileText, DollarSign, Package } from "lucide-react"
import AddTransactionForm from "./add-transaction-form"
import EditCustomerForm from "./edit-customer-form"
import TransactionHistory from "./transaction-history" // The new, rebuilt component
import { Badge } from "./ui/badge"

const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);

export default function EnhancedCustomerDetail({ customerId, onBack }) {
  const { customers, getCustomerTransactions, deleteCustomer, user } = useStore()
  const { permissions } = useRBAC(user)
  
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
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="mt-4">
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-gray-500">{customer.phone} | {customer.email}</p>
            <Badge>{customer.category}</Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          {permissions.includes('customers:update') && (
            <Button onClick={() => setIsEditingCustomer(true)}>Edit Customer</Button>
          )}
          {permissions.includes('transactions:create') && (
            <Button onClick={() => setIsAddingTransaction(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              New Transaction
            </Button>
          )}
        </div>
      </div>

      {/* NEW Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${customer.financial_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              Ksh {formatNumber(customer.financial_balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {customer.financial_balance > 0 ? 'Owed to us' : 'Customer Credit'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cylinder Balance</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${customer.cylinder_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {customer.cylinder_balance > 0 ? `+${customer.cylinder_balance}`: (customer.cylinder_balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
               {customer.cylinder_balance > 0 ? 'Cylinders Owed to us' : 'Cylinders Owed to Customer'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* NEW Transaction History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>A complete record of all transactions for this customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionHistory transactions={customerTransactions} customerId={customerId} />
        </CardContent>
      </Card>

      {/* Delete Customer Section */}
      {permissions.includes('customers:delete') && (
        <Card className="border-red-500 border-2">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Permanently delete this customer and all their associated data. This action cannot be undone.</p>
            <Button variant="destructive" className="mt-4" onClick={handleDeleteCustomer}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Customer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
