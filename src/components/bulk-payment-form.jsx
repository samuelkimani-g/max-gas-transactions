"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { DollarSign, CreditCard, CalendarDays, CheckSquare, Square, Users, FileText, AlertCircle } from "lucide-react"
import { useStore } from "../lib/store"
import { formatCurrency, calculateTransactionTotal } from "../lib/calculations"
import { toast } from "../hooks/use-toast"

export default function BulkPaymentForm({ customerId, customerName, outstandingAmount }) {
  const { recordBulkPaymentSelect, getCustomerTransactions, refreshAllData } = useStore()
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNote, setPaymentNote] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [isOpen, setIsOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [selectedIds, setSelectedIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get all customer transactions to show in the payment form
  const customerTransactions = getCustomerTransactions(customerId)
  const unpaidTransactions = useMemo(() => customerTransactions.filter((t) => {
    const total = calculateTransactionTotal(t)
    return total - (t.amount_paid || 0) > 0
  }), [customerTransactions])

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
      setIsSubmitting(false)
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



  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
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

      await recordBulkPaymentSelect(
        customerId,
        selectedIds,
        amount,
        paymentMethod,
        `${paymentMethod.toUpperCase()}: ${paymentNote || `Bulk payment of ${formatCurrency(amount)}`} (${paymentDate})`
      )
      
      toast({
        title: "Payment Recorded Successfully",
        description: `Payment of ${formatCurrency(amount)} has been recorded for ${customerName}.`,
      })
      
      setPaymentAmount("")
      setPaymentNote("")
      setIsOpen(false)
      
      await refreshAllData() // Trigger a refresh to update the outstanding balance
      
    } catch (error) {
      console.error('Failed to record selectable bulk payment:', error)
      toast({
        title: "Payment Failed",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3">
          <DollarSign className="w-5 h-5 mr-2" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <CreditCard className="w-6 h-6 text-green-600" />
            Record Bulk Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Customer Summary Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                <Users className="w-5 h-5" />
                Customer Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Customer</p>
                  <p className="font-semibold text-gray-800">{customerName}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(outstandingAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Unpaid Transactions</p>
                  <p className="text-xl font-semibold text-blue-600">{unpaidTransactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Selection */}
          {unpaidTransactions.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Select Transactions to Pay
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="flex items-center gap-2"
                  >
                    {selectAll ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    {selectAll ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                                                <th className="px-4 py-3 text-left">
                          <div className="flex items-center justify-center pointer-events-auto">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                console.log('Select all button clicked');
                                handleSelectAll();
                              }}
                              className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                                selectAll 
                                  ? 'bg-green-600 border-green-600 text-white' 
                                  : 'border-gray-300 hover:border-green-500'
                              }`}
                            >
                              {selectAll && (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Transaction</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Paid</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Outstanding</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {unpaidTransactions.map((t) => {
                        const total = calculateTransactionTotal(t)
                        const paid = t.amount_paid || 0
                        const outstanding = total - paid
                        const isSelected = selectedIds.includes(t.id)
                        
                        return (
                          <tr 
                            key={t.id} 
                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                              isSelected ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                            }`}
                            onClick={(e) => {
                              // Don't trigger row click if clicking on checkbox
                              if (e.target.type === 'checkbox') {
                                return;
                              }
                              handleSelect(t.id);
                            }}
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center pointer-events-auto">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    console.log('Checkbox button clicked for transaction:', t.id);
                                    handleSelect(t.id);
                                  }}
                                  className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                                    isSelected 
                                      ? 'bg-green-600 border-green-600 text-white' 
                                      : 'border-gray-300 hover:border-green-500'
                                  }`}
                                >
                                  {isSelected && (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-blue-700 font-semibold text-sm">
                                {t.transaction_number}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(t.date).toLocaleDateString("en-GB", { 
                                day: "2-digit", 
                                month: "2-digit", 
                                year: "2-digit" 
                              })}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium">
                              {formatCurrency(total)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600">
                              {formatCurrency(paid)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-red-600">
                              {formatCurrency(outstanding)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {outstanding <= 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Paid
                                </span>
                              ) : paid > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Partial
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selection Summary */}
          {selectedIds.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckSquare className="w-5 h-5" />
                  <span className="font-semibold">
                    Selected {selectedIds.length} transaction{selectedIds.length > 1 ? "s" : ""} 
                    totaling <span className="text-green-900">{formatCurrency(totalOutstandingSelected)}</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Amount */}
                <div>
                  <Label htmlFor="paymentAmount" className="text-base font-semibold text-gray-700">
                    Payment Amount (KSH)
                  </Label>
                  <div className="mt-2 space-y-3">
                    <Input
                      id="paymentAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter payment amount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      required
                      className="text-lg font-semibold"
                      disabled={selectedIds.length === 0}
                    />

                  </div>
                </div>

                {/* Payment Date */}
                <div>
                  <Label htmlFor="paymentDate" className="text-base font-semibold text-gray-700">
                    Payment Date
                  </Label>
                  <div className="flex items-center mt-2">
                    <CalendarDays className="w-5 h-5 mr-2 text-gray-400" />
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <Label className="text-base font-semibold text-gray-700 mb-3 block">
                    Payment Method
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      type="button"
                      variant={paymentMethod === "cash" ? "default" : "outline"}
                      className={`h-12 ${paymentMethod === "cash" ? "bg-green-600 hover:bg-green-700" : ""}`}
                      onClick={() => setPaymentMethod("cash")}
                    >
                      💵 Cash
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === "mpesa" ? "default" : "outline"}
                      className={`h-12 ${paymentMethod === "mpesa" ? "bg-green-600 hover:bg-green-700" : ""}`}
                      onClick={() => setPaymentMethod("mpesa")}
                    >
                      📱 M-Pesa
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === "bank" ? "default" : "outline"}
                      className={`h-12 ${paymentMethod === "bank" ? "bg-green-600 hover:bg-green-700" : ""}`}
                      onClick={() => setPaymentMethod("bank")}
                    >
                      🏦 Bank
                    </Button>
                  </div>
                </div>

                {/* Payment Note */}
                <div>
                  <Label htmlFor="paymentNote" className="text-base font-semibold text-gray-700">
                    Payment Note (Optional)
                  </Label>
                  <Input
                    id="paymentNote"
                    placeholder="Add a note about this payment..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            {paymentAmount && selectedIds.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-800">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-semibold">Payment Summary</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Payment Amount:</span>
                        <span className="ml-2 font-bold text-blue-900">
                          {formatCurrency(Number.parseFloat(paymentAmount) || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Remaining Balance:</span>
                        <span className="ml-2 font-bold text-red-600">
                          {formatCurrency(totalOutstandingSelected - (Number.parseFloat(paymentAmount) || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)} 
                className="flex-1 h-12 text-lg"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                disabled={selectedIds.length === 0 || !paymentAmount || Number(paymentAmount) <= 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5 mr-2" />
                    Record Payment
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}