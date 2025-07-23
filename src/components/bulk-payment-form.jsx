"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent } from "./ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { DollarSign, CreditCard, CalendarDays } from "lucide-react"
import { useStore } from "../lib/store"
import { formatCurrency, calculateTransactionTotal } from "../lib/calculations"
import { toast } from "../hooks/use-toast"

export default function BulkPaymentForm({ customerId, customerName, outstandingAmount }) {
  const { recordBulkPayment, getCustomerTransactions } = useStore()
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNote, setPaymentNote] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [isOpen, setIsOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")

  // Get all customer transactions to show in the payment form
  const customerTransactions = getCustomerTransactions(customerId)
  const unpaidTransactions = customerTransactions.filter((t) => {
    const total = calculateTransactionTotal(t)
    return total - (t.amount_paid || 0) > 0
  })

  useEffect(() => {
    if (isOpen) {
      setPaymentAmount("")
      setPaymentNote("")
      setPaymentDate(new Date().toISOString().split("T")[0])
      setPaymentMethod("cash")
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = Number.parseFloat(paymentAmount)

    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      })
      return
    }

    try {
      const paymentDetails = {
        amount,
        date: paymentDate,
        method: paymentMethod,
        note: paymentNote || `Bulk payment of ${formatCurrency(amount)}`,
      }

      await recordBulkPayment(
        customerId,
        amount,
        `${paymentMethod.toUpperCase()}: ${paymentNote || `Bulk payment of ${formatCurrency(amount)}`} (${paymentDate})`,
      )

      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrency(amount)} has been recorded for ${customerName}.`,
      })

      setPaymentAmount("")
      setPaymentNote("")
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to record bulk payment:', error)
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

            <div className="max-h-[70vh] overflow-y-auto">
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
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentAmount(String(outstandingAmount / 2))}
                    >
                      Half
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentAmount(String(outstandingAmount))}
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

                {unpaidTransactions.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-2">Unpaid Transactions</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {unpaidTransactions.map((t) => {
                        const total = calculateTransactionTotal(t)
                        const outstanding = total - (t.amount_paid || 0)
                        return (
                          <div key={t.id} className="flex justify-between text-xs">
                            <span>
                              Transaction #{t.id} ({new Date(t.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit", 
                  year: "2-digit"
                })})
                            </span>
                            <span className="font-medium text-red-600">{formatCurrency(outstanding)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {paymentAmount && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800">
                      Recording payment of{" "}
                      <span className="font-bold">{formatCurrency(Number.parseFloat(paymentAmount) || 0)}</span>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Remaining balance: {formatCurrency(outstandingAmount - (Number.parseFloat(paymentAmount) || 0))}
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
                  >
                    Record Payment
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
