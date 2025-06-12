"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { Edit, Trash2, ChevronDown, ChevronUp, Check, X, Receipt } from "lucide-react"
import { useStore } from "../lib/store"
import { formatCurrency } from "../lib/calculations"
import EditTransactionForm from "./edit-transaction-form"
import ConfirmationDialog from "./confirmation-dialog"

export default function TransactionHistory({ customerId, onViewReceipt }) {
  const { transactions, deleteTransaction, getCustomerTransactions } = useStore()
  const [expandedId, setExpandedId] = useState(null)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, transaction: null })

  const customerTransactions = getCustomerTransactions(customerId).sort((a, b) => new Date(b.date) - new Date(a.date))

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleDelete = (transaction) => {
    setDeleteConfirm({ isOpen: true, transaction })
  }

  const confirmDelete = () => {
    if (deleteConfirm.transaction) {
      deleteTransaction(deleteConfirm.transaction.id)
      setDeleteConfirm({ isOpen: false, transaction: null })
    }
  }

  const handleEditSuccess = () => {
    setEditingTransaction(null)
  }

  const calculateTransactionTotal = (transaction) => {
    const refill6kg = (transaction.return6kg || 0) * (transaction.refillPrice6kg || 135)
    const refill13kg = (transaction.return13kg || 0) * (transaction.refillPrice13kg || 135)
    const refill50kg = (transaction.return50kg || 0) * (transaction.refillPrice50kg || 135)
    const outright6kg = (transaction.outright6kg || 0) * (transaction.outrightPrice6kg || 3200)
    const outright13kg = (transaction.outright13kg || 0) * (transaction.outrightPrice13kg || 3500)
    const outright50kg = (transaction.outright50kg || 0) * (transaction.outrightPrice50kg || 8500)
    const swipe6kg = (transaction.swipeReturn6kg || 0) * (transaction.swipeRefillPrice6kg || 160)
    const swipe13kg = (transaction.swipeReturn13kg || 0) * (transaction.swipeRefillPrice13kg || 160)
    const swipe50kg = (transaction.swipeReturn50kg || 0) * (transaction.swipeRefillPrice50kg || 160)

    return (
      refill6kg + refill13kg + refill50kg + outright6kg + outright13kg + outright50kg + swipe6kg + swipe13kg + swipe50kg
    )
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
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No transactions found for this customer.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {customerTransactions.map((transaction) => {
        const total = calculateTransactionTotal(transaction)
        const paid = Number(transaction.paid) || 0
        const outstanding = total - paid
        const isExpanded = expandedId === transaction.id

        return (
          <Card key={transaction.id} className="overflow-hidden transition-all duration-200 bg-white">
            <CardContent className="p-0">
              {/* Transaction Header */}
              <div className="p-4 cursor-pointer" onClick={() => toggleExpand(transaction.id)}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-medium text-gray-900">Transaction #{transaction.id}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString("en-GB", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge className={outstanding <= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {outstanding <= 0 ? (
                        <span className="flex items-center">
                          <Check className="w-3 h-3 mr-1" />
                          Paid
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <X className="w-3 h-3 mr-1" />
                          Outstanding
                        </span>
                      )}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total</div>
                      <div className="font-semibold">{formatCurrency(total)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Outstanding</div>
                      <div className={`font-semibold ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(outstanding)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingTransaction(transaction)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewReceipt && onViewReceipt(transaction)
                        }}
                      >
                        <Receipt className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(transaction)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* MaxGas Returns */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">MaxGas Returns (Refills)</h4>
                      <div className="space-y-1 text-sm">
                        {transaction.return6kg > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">6kg Returns:</span>
                            <span>
                              {transaction.return6kg} × {formatCurrency(transaction.refillPrice6kg || 135)}
                            </span>
                          </div>
                        )}
                        {transaction.return13kg > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">13kg Returns:</span>
                            <span>
                              {transaction.return13kg} × {formatCurrency(transaction.refillPrice13kg || 135)}
                            </span>
                          </div>
                        )}
                        {transaction.return50kg > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">50kg Returns:</span>
                            <span>
                              {transaction.return50kg} × {formatCurrency(transaction.refillPrice50kg || 135)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* MaxGas Outright */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">MaxGas Outright Sales</h4>
                      <div className="space-y-1 text-sm">
                        {transaction.outright6kg > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">6kg Outright:</span>
                            <span>
                              {transaction.outright6kg} × {formatCurrency(transaction.outrightPrice6kg || 3200)}
                            </span>
                          </div>
                        )}
                        {transaction.outright13kg > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">13kg Outright:</span>
                            <span>
                              {transaction.outright13kg} × {formatCurrency(transaction.outrightPrice13kg || 3500)}
                            </span>
                          </div>
                        )}
                        {transaction.outright50kg > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">50kg Outright:</span>
                            <span>
                              {transaction.outright50kg} × {formatCurrency(transaction.outrightPrice50kg || 8500)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Other Company Swipes */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Other Company Swipes</h4>
                      <div className="space-y-1 text-sm">
                        {transaction.swipeReturn6kg > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">6kg Swipes:</span>
                            <span>
                              {transaction.swipeReturn6kg} × {formatCurrency(transaction.swipeRefillPrice6kg || 160)}
                            </span>
                          </div>
                        )}
                        {transaction.swipeReturn13kg > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">13kg Swipes:</span>
                            <span>
                              {transaction.swipeReturn13kg} × {formatCurrency(transaction.swipeRefillPrice13kg || 160)}
                            </span>
                          </div>
                        )}
                        {transaction.swipeReturn50kg > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">50kg Swipes:</span>
                            <span>
                              {transaction.swipeReturn50kg} × {formatCurrency(transaction.swipeRefillPrice50kg || 160)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="bg-white p-3 rounded">
                        <div className="text-sm text-gray-500">Total Amount</div>
                        <div className="text-lg font-bold">{formatCurrency(total)}</div>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <div className="text-sm text-gray-500">Amount Paid</div>
                        <div className="text-lg font-bold text-green-600">{formatCurrency(paid)}</div>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <div className="text-sm text-gray-500">Outstanding</div>
                        <div className={`text-lg font-bold ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                          {formatCurrency(outstanding)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {transaction.notes && (
                    <div className="mt-4 p-3 bg-white rounded">
                      <div className="text-sm text-gray-500">Notes</div>
                      <div className="text-sm">{transaction.notes}</div>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewReceipt && onViewReceipt(transaction)
                      }}
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      View Receipt
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingTransaction(transaction)
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Transaction
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, transaction: null })}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message={`Are you sure you want to delete Transaction #${deleteConfirm.transaction?.id}? This action cannot be undone and will permanently remove this transaction from the customer's history.`}
        type="danger"
        confirmText="Delete Transaction"
        cancelText="Cancel"
      />
    </div>
  )
}
