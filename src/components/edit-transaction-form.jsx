"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ArrowLeft, Save, Receipt } from "lucide-react"
import { useStore } from "../lib/store"
import { useRBAC } from "../lib/rbac"
import { formatCurrency, calculateTransactionTotal } from "../lib/calculations"
import { toast } from "../hooks/use-toast"

export default function EditTransactionForm({ transaction, onBack, onSuccess }) {
  const { updateTransaction, submitApprovalRequest, user } = useStore()
  const { permissions } = useRBAC(user)
  const [formData, setFormData] = useState({
    // Load quantities (cylinders given to customer)
    maxGas6kgLoad: transaction.maxGas6kgLoad || 0,
    maxGas13kgLoad: transaction.maxGas13kgLoad || 0,
    maxGas50kgLoad: transaction.maxGas50kgLoad || 0,

    // Return quantities
    return6kg: transaction.return6kg || 0,
    return13kg: transaction.return13kg || 0,
    return50kg: transaction.return50kg || 0,

    // Outright quantities (full cylinders sold)
    outright6kg: transaction.outright6kg || 0,
    outright13kg: transaction.outright13kg || 0,
    outright50kg: transaction.outright50kg || 0,

    // Swipe return quantities
    swipeReturn6kg: transaction.swipeReturn6kg || 0,
    swipeReturn13kg: transaction.swipeReturn13kg || 0,
    swipeReturn50kg: transaction.swipeReturn50kg || 0,

    // Pricing
    refillPrice6kg: transaction.refillPrice6kg || 135,
    refillPrice13kg: transaction.refillPrice13kg || 135,
    refillPrice50kg: transaction.refillPrice50kg || 135,
    outrightPrice6kg: transaction.outrightPrice6kg || 3200,
    outrightPrice13kg: transaction.outrightPrice13kg || 3500,
    outrightPrice50kg: transaction.outrightPrice50kg || 8500,
    swipeRefillPrice6kg: transaction.swipeRefillPrice6kg || 160,
    swipeRefillPrice13kg: transaction.swipeRefillPrice13kg || 160,
    swipeRefillPrice50kg: transaction.swipeRefillPrice50kg || 160,

    // Payment
    paid: transaction.paid || 0,
    notes: transaction.notes || "",
  })

  const total = calculateTransactionTotal(formData)
  const outstanding = total - formData.paid

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // If user is operator, submit approval request instead of direct update
      if (permissions?.canRequestApproval && !permissions?.canEditTransaction) {
        const approvalData = {
          requestType: 'transaction_edit',
          entityType: 'transaction',
          entityId: transaction.id,
          requestedChanges: formData,
          reason: `Requesting to update transaction #${transaction.id} for customer ${transaction.customerId}`
        }

        await submitApprovalRequest(approvalData)

        toast({
          title: "Approval Request Submitted",
          description: "Your request has been sent to management for approval.",
        })

        onSuccess()
      } else {
        // Direct update for managers and admins
        await updateTransaction(transaction.id, {
          ...transaction,
          ...formData,
          updatedAt: new Date().toISOString(),
        })

        toast({
          title: "Transaction Updated",
          description: "Transaction has been updated successfully.",
        })

        onSuccess()
      }
    } catch (error) {
      console.error('Failed to update transaction:', error)
      toast({
        title: "Error",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]:
        field.includes("Price") || field === "paid" ? Number.parseFloat(value) || 0 : Number.parseInt(value) || 0,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button onClick={onBack} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Edit Transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Load Quantities */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Load Quantities (Cylinders Given)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxGas6kgLoad">6kg Load</Label>
                    <Input
                      id="maxGas6kgLoad"
                      type="number"
                      min="0"
                      value={formData.maxGas6kgLoad}
                      onChange={(e) => handleChange("maxGas6kgLoad", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxGas13kgLoad">13kg Load</Label>
                    <Input
                      id="maxGas13kgLoad"
                      type="number"
                      min="0"
                      value={formData.maxGas13kgLoad}
                      onChange={(e) => handleChange("maxGas13kgLoad", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxGas50kgLoad">50kg Load</Label>
                    <Input
                      id="maxGas50kgLoad"
                      type="number"
                      min="0"
                      value={formData.maxGas50kgLoad}
                      onChange={(e) => handleChange("maxGas50kgLoad", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Return Quantities */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Return Quantities</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="return6kg">6kg Returns</Label>
                    <Input
                      id="return6kg"
                      type="number"
                      min="0"
                      value={formData.return6kg}
                      onChange={(e) => handleChange("return6kg", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="return13kg">13kg Returns</Label>
                    <Input
                      id="return13kg"
                      type="number"
                      min="0"
                      value={formData.return13kg}
                      onChange={(e) => handleChange("return13kg", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="return50kg">50kg Returns</Label>
                    <Input
                      id="return50kg"
                      type="number"
                      min="0"
                      value={formData.return50kg}
                      onChange={(e) => handleChange("return50kg", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Outright Sales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Outright Sales (Full Cylinders)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="outright6kg">6kg Outright</Label>
                    <Input
                      id="outright6kg"
                      type="number"
                      min="0"
                      value={formData.outright6kg}
                      onChange={(e) => handleChange("outright6kg", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outright13kg">13kg Outright</Label>
                    <Input
                      id="outright13kg"
                      type="number"
                      min="0"
                      value={formData.outright13kg}
                      onChange={(e) => handleChange("outright13kg", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outright50kg">50kg Outright</Label>
                    <Input
                      id="outright50kg"
                      type="number"
                      min="0"
                      value={formData.outright50kg}
                      onChange={(e) => handleChange("outright50kg", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Swipe Returns */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Swipe Returns</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="swipeReturn6kg">6kg Swipe Returns</Label>
                    <Input
                      id="swipeReturn6kg"
                      type="number"
                      min="0"
                      value={formData.swipeReturn6kg}
                      onChange={(e) => handleChange("swipeReturn6kg", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="swipeReturn13kg">13kg Swipe Returns</Label>
                    <Input
                      id="swipeReturn13kg"
                      type="number"
                      min="0"
                      value={formData.swipeReturn13kg}
                      onChange={(e) => handleChange("swipeReturn13kg", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="swipeReturn50kg">50kg Swipe Returns</Label>
                    <Input
                      id="swipeReturn50kg"
                      type="number"
                      min="0"
                      value={formData.swipeReturn50kg}
                      onChange={(e) => handleChange("swipeReturn50kg", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
                
                {/* Refill Pricing (per kg) */}
                <div className="space-y-2">
                  <h4 className="text-md font-medium text-gray-700">Refill Pricing (KSH per kg)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="refillPrice6kg">6kg Refill Price</Label>
                      <Input
                        id="refillPrice6kg"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.refillPrice6kg}
                        onChange={(e) => handleChange("refillPrice6kg", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="refillPrice13kg">13kg Refill Price</Label>
                      <Input
                        id="refillPrice13kg"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.refillPrice13kg}
                        onChange={(e) => handleChange("refillPrice13kg", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="refillPrice50kg">50kg Refill Price</Label>
                      <Input
                        id="refillPrice50kg"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.refillPrice50kg}
                        onChange={(e) => handleChange("refillPrice50kg", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Outright Pricing (per cylinder) */}
                <div className="space-y-2">
                  <h4 className="text-md font-medium text-gray-700">Outright Pricing (KSH per cylinder)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="outrightPrice6kg">6kg Outright Price</Label>
                      <Input
                        id="outrightPrice6kg"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.outrightPrice6kg}
                        onChange={(e) => handleChange("outrightPrice6kg", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="outrightPrice13kg">13kg Outright Price</Label>
                      <Input
                        id="outrightPrice13kg"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.outrightPrice13kg}
                        onChange={(e) => handleChange("outrightPrice13kg", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="outrightPrice50kg">50kg Outright Price</Label>
                      <Input
                        id="outrightPrice50kg"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.outrightPrice50kg}
                        onChange={(e) => handleChange("outrightPrice50kg", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Swipe Pricing (per kg) */}
                <div className="space-y-2">
                  <h4 className="text-md font-medium text-gray-700">Swipe Pricing (KSH per kg)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="swipeRefillPrice6kg">6kg Swipe Price</Label>
                      <Input
                        id="swipeRefillPrice6kg"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.swipeRefillPrice6kg}
                        onChange={(e) => handleChange("swipeRefillPrice6kg", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="swipeRefillPrice13kg">13kg Swipe Price</Label>
                      <Input
                        id="swipeRefillPrice13kg"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.swipeRefillPrice13kg}
                        onChange={(e) => handleChange("swipeRefillPrice13kg", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="swipeRefillPrice50kg">50kg Swipe Price</Label>
                      <Input
                        id="swipeRefillPrice50kg"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.swipeRefillPrice50kg}
                        onChange={(e) => handleChange("swipeRefillPrice50kg", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paid">Amount Paid (KSH)</Label>
                    <Input
                      id="paid"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.paid}
                      onChange={(e) => handleChange("paid", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      placeholder="Add any notes"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-xl font-bold text-indigo-600">{formatCurrency(total)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount Paid</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(formData.paid)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Outstanding</p>
                    <p className={`text-xl font-bold ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(outstanding)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Transaction
                </Button>
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
