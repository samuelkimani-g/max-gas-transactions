"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Trash2, DollarSign, X, CheckSquare } from "lucide-react"
import { useStore } from "../lib/store"
import { formatCurrency } from "../lib/calculations"
import { toast } from "../hooks/use-toast"

export default function BulkActionsPanel({ selectedTransactions, onClearSelection }) {
  const { deleteTransaction, updateTransaction } = useStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showBulkPayment, setShowBulkPayment] = useState(false)
  const [bulkPaymentAmount, setBulkPaymentAmount] = useState("")

  const handleBulkDelete = async () => {
    try {
      const { bulkDeleteTransactions } = useStore.getState()
      await bulkDeleteTransactions(selectedTransactions.map(t => t.id))

      toast({
        title: "Transactions Deleted",
        description: `${selectedTransactions.length} transactions have been deleted.`,
      })

      onClearSelection()
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Failed to bulk delete transactions:', error)
      toast({
        title: "Error",
        description: "Failed to delete transactions. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBulkPayment = async () => {
    const paymentAmount = Number.parseFloat(bulkPaymentAmount)
    if (paymentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      })
      return
    }

    try {
      const { bulkUpdateTransactionPayments } = useStore.getState()
      await bulkUpdateTransactionPayments(selectedTransactions.map(t => t.id), paymentAmount)

      toast({
        title: "Bulk Payment Applied",
        description: `Payment of ${formatCurrency(paymentAmount)} applied to ${selectedTransactions.length} transactions.`,
      })

      setBulkPaymentAmount("")
      onClearSelection()
      setShowBulkPayment(false)
    } catch (error) {
      console.error('Failed to apply bulk payment:', error)
      toast({
        title: "Error",
        description: "Failed to apply bulk payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (selectedTransactions.length === 0) {
    return null
  }

  return (
    <Card className="shadow-lg border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <CheckSquare className="w-5 h-5" />
            {selectedTransactions.length} Transaction{selectedTransactions.length > 1 ? "s" : ""} Selected
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {/* Bulk Payment */}
          <Dialog open={showBulkPayment} onOpenChange={setShowBulkPayment}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                <DollarSign className="w-4 h-4 mr-2" />
                Bulk Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply Bulk Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Apply payment across {selectedTransactions.length} selected transactions
                </p>
                <div>
                  <Label htmlFor="bulkAmount">Total Payment Amount (KSH)</Label>
                  <Input
                    id="bulkAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter total amount"
                    value={bulkPaymentAmount}
                    onChange={(e) => setBulkPaymentAmount(e.target.value)}
                  />
                  {bulkPaymentAmount && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(Number.parseFloat(bulkPaymentAmount) / selectedTransactions.length)} per
                      transaction
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleBulkPayment} className="flex-1">
                    Apply Payment
                  </Button>
                  <Button variant="outline" onClick={() => setShowBulkPayment(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Delete */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Transactions</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>
                  Are you sure you want to delete {selectedTransactions.length} selected transaction
                  {selectedTransactions.length > 1 ? "s" : ""}? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleBulkDelete}>
                    Delete {selectedTransactions.length} Transaction{selectedTransactions.length > 1 ? "s" : ""}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={onClearSelection}>
            Clear Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
