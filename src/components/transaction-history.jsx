"use client"

import { useState, useMemo } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { Edit, Trash2, ChevronDown, ChevronUp, Check, X, Receipt, Filter } from "lucide-react"
import { useStore } from "../lib/store"
import { useRBAC } from "../lib/rbac"
import { formatCurrency, calculateTransactionTotal } from "../lib/calculations"
import EditTransactionForm from "./edit-transaction-form"
import ConfirmationDialog from "./confirmation-dialog"
import { toast } from "../hooks/use-toast"

export default function TransactionHistory({ customerId, onViewReceipt }) {
  const { deleteTransaction, getCustomerTransactions, submitApprovalRequest, user } = useStore()
  const { permissions } = useRBAC(user)
  const [expandedId, setExpandedId] = useState(null)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, transaction: null })

  // Filter states
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')



  // Apply filters to customer transactions
  const customerTransactions = useMemo(() => {
    const allTransactions = getCustomerTransactions(customerId)
    console.log(`Customer ${customerId} has ${allTransactions.length} total transactions:`, allTransactions)
    
    let filtered = allTransactions
      .filter((t) => {
        if (!t || !t.date) {
          console.log("Filtering out transaction without date:", t)
          return false
        }
        
        // Date range filter
        if (dateRange.start && new Date(t.date) < new Date(dateRange.start)) {
          console.log("Filtering out transaction before date range:", t.date, "start:", dateRange.start)
          return false
        }
        if (dateRange.end && new Date(t.date) > new Date(dateRange.end)) {
          console.log("Filtering out transaction after date range:", t.date, "end:", dateRange.end)
          return false
        }
        
        // Transaction type filter
        if (transactionTypeFilter !== 'all') {
          const hasRefill = (t.return6kg || 0) + (t.return13kg || 0) + (t.return50kg || 0) > 0
          const hasOutright = (t.outright6kg || 0) + (t.outright13kg || 0) + (t.outright50kg || 0) > 0
          const hasSwipe = (t.swipeReturn6kg || 0) + (t.swipeReturn13kg || 0) + (t.swipeReturn50kg || 0) > 0
          
          switch (transactionTypeFilter) {
            case 'refill':
              if (!hasRefill) {
                console.log("Filtering out non-refill transaction:", t)
                return false
              }
              break
            case 'outright':
              if (!hasOutright) {
                console.log("Filtering out non-outright transaction:", t)
                return false
              }
              break
            case 'swipe':
              if (!hasSwipe) {
                console.log("Filtering out non-swipe transaction:", t)
                return false
              }
              break
          }
        }
        
        // Amount range filter
        const total = calculateTransactionTotal(t)
        if (minAmount && total < parseFloat(minAmount)) {
          console.log("Filtering out transaction below min amount:", total, "min:", minAmount)
          return false
        }
        if (maxAmount && total > parseFloat(maxAmount)) {
          console.log("Filtering out transaction above max amount:", total, "max:", maxAmount)
          return false
        }
        
        // Status filter
        if (statusFilter !== 'all') {
          const paid = t.paid || 0
          const outstanding = total - paid
          
          switch (statusFilter) {
            case 'paid':
              if (outstanding > 0) {
                console.log("Filtering out non-paid transaction:", outstanding)
                return false
              }
              break
            case 'outstanding':
              if (outstanding <= 0) {
                console.log("Filtering out paid transaction:", outstanding)
                return false
              }
              break
            case 'partial':
              if (outstanding <= 0 || outstanding >= total) {
                console.log("Filtering out non-partial transaction:", outstanding, "total:", total)
                return false
              }
              break
          }
        }
        
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    
    console.log(`Customer ${customerId} has ${filtered.length} filtered transactions`)
    return filtered
  }, [customerId, dateRange, transactionTypeFilter, statusFilter, minAmount, maxAmount])

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleDelete = (transaction) => {
    setDeleteConfirm({ isOpen: true, transaction })
  }

  const confirmDelete = async () => {
    if (deleteConfirm.transaction) {
      try {
        // If user is operator, submit approval request instead of direct delete
        if (permissions?.canRequestApproval && !permissions?.canDeleteTransaction) {
          const approvalData = {
            requestType: 'transaction_delete',
            entityType: 'transaction',
            entityId: deleteConfirm.transaction.id,
            reason: `Requesting to delete transaction #${deleteConfirm.transaction.id} for customer ${deleteConfirm.transaction.customerId}`
          }

          await submitApprovalRequest(approvalData)
          
          toast({
            title: "Approval Request Submitted",
            description: "Your request has been sent to management for approval.",
          })
        } else {
          // Direct delete for managers and admins
          await deleteTransaction(deleteConfirm.transaction.id)
        }
        
        setDeleteConfirm({ isOpen: false, transaction: null })
      } catch (error) {
        console.error('Failed to delete transaction:', error)
        // Keep the dialog open if deletion fails
      }
    }
  }

  const handleEditSuccess = () => {
    setEditingTransaction(null)
  }

  // Clear all filters
  const clearFilters = () => {
    setDateRange({ start: '', end: '' })
    setTransactionTypeFilter('all')
    setStatusFilter('all')
    setMinAmount('')
    setMaxAmount('')
  }

  if (editingTransaction) {
    return (
      <EditTransactionForm
        transaction={editingTransaction}
        onBack={() => setEditingTransaction(null)}
        onSuccess={handleEditSuccess}
      />
    )
  }

  if (customerTransactions.length === 0) {
    const allTransactions = getCustomerTransactions(customerId)
    const hasFilters = dateRange.start || dateRange.end || transactionTypeFilter !== 'all' || statusFilter !== 'all' || minAmount || maxAmount
    
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {hasFilters ? "No transactions match the current filters." : "No transactions found for this customer."}
        </p>
        {hasFilters && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Active filters:</p>
            <div className="text-xs text-gray-400 space-y-1">
              {dateRange.start && <p>Date from: {dateRange.start}</p>}
              {dateRange.end && <p>Date to: {dateRange.end}</p>}
              {transactionTypeFilter !== 'all' && <p>Type: {transactionTypeFilter}</p>}
              {statusFilter !== 'all' && <p>Status: {statusFilter}</p>}
              {minAmount && <p>Min amount: {minAmount}</p>}
              {maxAmount && <p>Max amount: {maxAmount}</p>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-3"
            >
              Clear All Filters
            </Button>
          </div>
        )}
        {allTransactions.length > 0 && (
          <p className="text-sm text-gray-400 mt-2">
            Customer has {allTransactions.length} total transactions
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {customerTransactions.length} transactions
          {(dateRange.start || dateRange.end || transactionTypeFilter !== 'all' || statusFilter !== 'all' || minAmount || maxAmount) && (
            <span className="text-orange-600 ml-2">
              (Filters active - click "Show All" to clear)
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {(dateRange.start || dateRange.end || transactionTypeFilter !== 'all' || statusFilter !== 'all' || minAmount || maxAmount) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-sm"
            >
              Show All
            </Button>
          )}
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(dateRange.start || dateRange.end || transactionTypeFilter !== 'all' || statusFilter !== 'all' || minAmount || maxAmount) && (
              <Badge variant="secondary" className="ml-1">
                Active
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label htmlFor="date-start" className="text-sm">Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    id="date-start"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    placeholder="Start Date"
                    className="text-sm"
                  />
                  <Input
                    id="date-end"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    placeholder="End Date"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Transaction Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="transaction-type" className="text-sm">Transaction Type</Label>
                <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="refill">Refills Only</SelectItem>
                    <SelectItem value="outright">Outright Sales</SelectItem>
                    <SelectItem value="swipe">Swipe Transactions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter" className="text-sm">Payment Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Fully Paid</SelectItem>
                    <SelectItem value="outstanding">Outstanding</SelectItem>
                    <SelectItem value="partial">Partially Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range Filter */}
              <div className="space-y-2">
                <Label htmlFor="amount-range" className="text-sm">Amount Range</Label>
                <div className="flex gap-2">
                  <Input
                    id="min-amount"
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="Min Amount"
                    className="text-sm"
                  />
                  <Input
                    id="max-amount"
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="Max Amount"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-sm"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction List */}
      {customerTransactions.map((transaction) => {
        const total = calculateTransactionTotal(transaction)
        const paid = Number(transaction.paid) || 0
        const outstanding = total - paid
        const isExpanded = expandedId === transaction.id

        return (
          <Card key={transaction.id} className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-900">
                      #{transaction.id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit", 
                  year: "2-digit"
                })}
                    </div>
                    <Badge className={outstanding <= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {outstanding <= 0 ? "Paid" : "Outstanding"}
                    </Badge>
                  </div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(total)}
                  </div>
                  {outstanding > 0 && (
                    <div className="text-sm text-red-600">
                      Outstanding: {formatCurrency(outstanding)}
                    </div>
                  )}
                      </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewReceipt(transaction)}
                  >
                    <Receipt className="w-4 h-4 mr-1" />
                    Receipt
                  </Button>
                      <Button
                    variant="outline"
                        size="sm"
                    onClick={() => setEditingTransaction(transaction)}
                      >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                      </Button>
                      <Button
                    variant="outline"
                        size="sm"
                    onClick={() => toggleExpand(transaction.id)}
                      >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button
                    variant="outline"
                        size="sm"
                    onClick={() => handleDelete(transaction)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700 mb-2">Loads</div>
                      <div className="space-y-1">

                        {transaction.maxGas6kgLoad > 0 && (
                          <div className="flex justify-between">
                            <span>6kg: {transaction.maxGas6kgLoad}</span>
                            <span className="text-gray-500">Cylinders given</span>
                          </div>
                        )}
                        {transaction.maxGas13kgLoad > 0 && (
                          <div className="flex justify-between">
                            <span>13kg: {transaction.maxGas13kgLoad}</span>
                            <span className="text-gray-500">Cylinders given</span>
                          </div>
                        )}
                        {transaction.maxGas50kgLoad > 0 && (
                          <div className="flex justify-between">
                            <span>50kg: {transaction.maxGas50kgLoad}</span>
                            <span className="text-gray-500">Cylinders given</span>
                          </div>
                        )}
                        {(!transaction.maxGas6kgLoad || transaction.maxGas6kgLoad === 0) && 
                         (!transaction.maxGas13kgLoad || transaction.maxGas13kgLoad === 0) && 
                         (!transaction.maxGas50kgLoad || transaction.maxGas50kgLoad === 0) && (
                          <div className="text-gray-400">No loads</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="font-medium text-gray-700 mb-2">Refills</div>
                      <div className="space-y-1">
                        {transaction.return6kg > 0 && (
                          <div className="flex justify-between">
                            <span>6kg: {transaction.return6kg}</span>
                            <span>{formatCurrency(transaction.return6kg * 6 * (transaction.refillPrice6kg || 135))}</span>
                          </div>
                        )}
                        {transaction.return13kg > 0 && (
                          <div className="flex justify-between">
                            <span>13kg: {transaction.return13kg}</span>
                            <span>{formatCurrency(transaction.return13kg * 13 * (transaction.refillPrice13kg || 135))}</span>
                          </div>
                        )}
                        {transaction.return50kg > 0 && (
                          <div className="flex justify-between">
                            <span>50kg: {transaction.return50kg}</span>
                            <span>{formatCurrency(transaction.return50kg * 50 * (transaction.refillPrice50kg || 135))}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="font-medium text-gray-700 mb-2">Outright Sales</div>
                      <div className="space-y-1">
                        {transaction.outright6kg > 0 && (
                          <div className="flex justify-between">
                            <span>6kg: {transaction.outright6kg}</span>
                            <span>{formatCurrency(transaction.outright6kg * (transaction.outrightPrice6kg || 3200))}</span>
                          </div>
                        )}
                        {transaction.outright13kg > 0 && (
                          <div className="flex justify-between">
                            <span>13kg: {transaction.outright13kg}</span>
                            <span>{formatCurrency(transaction.outright13kg * (transaction.outrightPrice13kg || 3500))}</span>
                          </div>
                        )}
                        {transaction.outright50kg > 0 && (
                          <div className="flex justify-between">
                            <span>50kg: {transaction.outright50kg}</span>
                            <span>{formatCurrency(transaction.outright50kg * (transaction.outrightPrice50kg || 8500))}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="font-medium text-gray-700 mb-2">Swipe Transactions</div>
                      <div className="space-y-1">
                        {transaction.swipeReturn6kg > 0 && (
                          <div className="flex justify-between">
                            <span>6kg: {transaction.swipeReturn6kg}</span>
                            <span>{formatCurrency(transaction.swipeReturn6kg * 6 * (transaction.swipeRefillPrice6kg || 160))}</span>
                          </div>
                        )}
                        {transaction.swipeReturn13kg > 0 && (
                          <div className="flex justify-between">
                            <span>13kg: {transaction.swipeReturn13kg}</span>
                            <span>{formatCurrency(transaction.swipeReturn13kg * 13 * (transaction.swipeRefillPrice13kg || 160))}</span>
                          </div>
                        )}
                        {transaction.swipeReturn50kg > 0 && (
                          <div className="flex justify-between">
                            <span>50kg: {transaction.swipeReturn50kg}</span>
                            <span>{formatCurrency(transaction.swipeReturn50kg * 50 * (transaction.swipeRefillPrice50kg || 160))}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {transaction.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-700 mb-1">Notes</div>
                      <div className="text-sm text-gray-600">{transaction.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, transaction: null })}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div>
  )
}
