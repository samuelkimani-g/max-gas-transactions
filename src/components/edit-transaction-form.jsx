"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ArrowLeft, Save, Receipt } from "lucide-react"
import { useStore } from "../lib/store"
import { formatCurrency, calculateTransactionTotal } from "../lib/calculations"
import { toast } from "../hooks/use-toast"

export default function EditTransactionForm({ transaction, onBack, onSuccess }) {
  const { updateTransaction } = useStore()
  const [formData, setFormData] = useState({
    // Return quantities
    return6kg: transaction.return6kg || 0,
    return13kg: transaction.return13kg || 0,
    return50kg: transaction.return50kg || 0,

    // Swipe return quantities
    swipeReturn6kg: transaction.swipeReturn6kg || 0,
    swipeReturn13kg: transaction.swipeReturn13kg || 0,

    // Pricing
    refillPrice6kg: transaction.refillPrice6kg || 100,
    refillPrice13kg: transaction.refillPrice13kg || 100,
    swipeRefillPrice6kg: transaction.swipeRefillPrice6kg || 120,
    swipeRefillPrice13kg: transaction.swipeRefillPrice13kg || 120,

    // Payment
    paid: transaction.paid || 0,
    notes: transaction.notes || "",
  })

  const total = calculateTransactionTotal(formData)
  const outstanding = total - formData.paid

  const handleSubmit = (e) => {
    e.preventDefault()

    updateTransaction(transaction.id, {
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

              {/* Swipe Returns */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Swipe Returns</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Pricing (KSH per kg)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
