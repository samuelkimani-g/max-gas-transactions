"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent } from "./ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { DollarSign, CreditCard, CalendarDays, CheckSquare, Square } from "lucide-react"
import { useStore } from "../lib/store"
import { formatCurrency, calculateTransactionTotal } from "../lib/calculations"
import { toast } from "../hooks/use-toast"

export default function BulkPaymentForm({ customerId, customerName, outstandingAmount }) {
  const { recordBulkPaymentSelect, getCustomerTransactions } = useStore()
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNote, setPaymentNote] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [isOpen, setIsOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [selectedIds, setSelectedIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  // Get all customer transactions to show in the payment form
  const customerTransactions = getCustomerTransactions(customerId)
  const unpaidTransactions = customerTransactions.filter((t) => {
    const total = calculateTransactionTotal(t)
    return total - (t.amount_paid || 0) > 0
  })

  // Calculate outstanding for selected transactions
  const selectedTransactions = unpaidTransactions.filter(t => selectedIds.includes(t.id))
  const totalOutstandingSelected = selectedTransactions.reduce((sum, t) => {
    const total = calculateTransactionTotal(t)
    return sum + (total - (t.amount_paid || 0))
  }, 0)

  useEffect(() => {
    if (isOpen) {
      setPaymentAmount("")
      setPaymentNote("")
      setPaymentDate(new Date().toISOString().split("T")[0])
      setPaymentMethod("cash")
      setSelectedIds([])
      setSelectAll(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (selectAll) {
      setSelectedIds(unpaidTransactions.map(t => t.id))
    } else {
      setSelectedIds([])
    }
  }, [selectAll, unpaidTransactions])

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSelectAll = () => {
    setSelectAll(prev => !prev)
  }

  const handleAmountButton = (type) => {
    if (type === 'half') {
      setPaymentAmount(String(totalOutstandingSelected / 2))
    } else if (type === 'full') {
      setPaymentAmount(String(totalOutstandingSelected))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = Number.parseFloat(paymentAmount)
    if (selectedIds.length === 0) {
      toast({
        title: "No Transactions Selected",
        description: "Please select at least one transaction to pay.",
        variant: "destructive",
      })
      return
    }
    if (amount <= 0 || isNaN(amount)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      })
      return
    }
    if (amount > totalOutstandingSelected) {
      toast({
        title: "Amount Too High",
        description: "Payment amount exceeds total outstanding for selected transactions.",
        variant: "destructive",
      })
      return
    }
    try {
      await recordBulkPaymentSelect(
        customerId,
        selectedIds,
        amount,
        paymentMethod,
        `${paymentMethod.toUpperCase()}: ${paymentNote || `Bulk payment of ${formatCurrency(amount)}`} (${paymentDate})`
      )
      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrency(amount)} has been recorded for ${customerName}.`,
      })
      setPaymentAmount("")
      setPaymentNote("")
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to record selectable bulk payment:', error)
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
          <DollarSign className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Record Bulk Payment
          </DialogTitle>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <CardContent className="p-0 space-y-4">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(outstandingAmount)}</p>
                <p className="text-sm text-gray-500 mt-1">for {customerName}</p>
              </div>
            </div>
            {unpaidTransactions.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Unpaid Transactions</p>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-blue-700 hover:underline"
                    onClick={handleSelectAll}
                  >
                    {selectAll ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />} Select All
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th></th>
                        <th>Serial No.</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Outstanding</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidTransactions.map((t) => {
                        const total = calculateTransactionTotal(t)
                        const paid = t.amount_paid || 0
                        const outstanding = total - paid
                        return (
                          <tr key={t.id} className={selectedIds.includes(t.id) ? "bg-green-50" : ""}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(t.id)}
                                onChange={() => handleSelect(t.id)}
                              />
                            </td>
                            <td className="font-mono text-blue-700 font-semibold">{t.transaction_number}</td>
                            <td>{new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })}</td>
                            <td>{formatCurrency(total)}</td>
                            <td>{formatCurrency(paid)}</td>
                            <td className="text-red-600 font-bold">{formatCurrency(outstanding)}</td>
                            <td>{outstanding <= 0 ? <span className="text-green-700 font-semibold">Paid</span> : paid > 0 ? <span className="text-yellow-700 font-semibold">Partial</span> : <span className="text-red-700 font-semibold">Pending</span>}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {selectedIds.length > 0 && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  Selected {selectedIds.length} transaction{selectedIds.length > 1 ? "s" : ""} totaling <span className="font-bold">{formatCurrency(totalOutstandingSelected)}</span>
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="paymentAmount">Payment Amount (KSH)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter payment amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  className="mt-1"
                  disabled={selectedIds.length === 0}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAmountButton('half')}
                    disabled={selectedIds.length === 0}
                  >
                    Half
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAmountButton('full')}
                    disabled={selectedIds.length === 0}
                  >
                    Full Amount
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="paymentDate">Payment Date</Label>
                <div className="flex items-center mt-1">
                  <CalendarDays className="w-4 h-4 mr-2 text-gray-400" />
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <Button
                    type="button"
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    className={paymentMethod === "cash" ? "bg-orange-500 hover:bg-orange-600" : ""}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    Cash
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "mpesa" ? "default" : "outline"}
                    className={paymentMethod === "mpesa" ? "bg-orange-500 hover:bg-orange-600" : ""}
                    onClick={() => setPaymentMethod("mpesa")}
                  >
                    M-Pesa
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "bank" ? "default" : "outline"}
                    className={paymentMethod === "bank" ? "bg-orange-500 hover:bg-orange-600" : ""}
                    onClick={() => setPaymentMethod("bank")}
                  >
                    Bank
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="paymentNote">Payment Note (Optional)</Label>
                <Input
                  id="paymentNote"
                  placeholder="Add a note about this payment"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="mt-1"
                />
              </div>
              {paymentAmount && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    Recording payment of {" "}
                    <span className="font-bold">{formatCurrency(Number.parseFloat(paymentAmount) || 0)}</span>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Remaining balance: {formatCurrency(totalOutstandingSelected - (Number.parseFloat(paymentAmount) || 0))}
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  disabled={selectedIds.length === 0 || !paymentAmount || Number(paymentAmount) <= 0}
                >
                  Record Payment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
