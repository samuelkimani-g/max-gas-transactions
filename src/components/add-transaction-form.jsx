"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ArrowLeft, Save, Calculator } from "lucide-react"
import { useStore } from "../lib/store"
import { formatCurrency } from "../lib/calculations"

export default function AddTransactionForm({ customerId, customerName, onBack, onSuccess }) {
  const { addTransaction } = useStore()
  const [formData, setFormData] = useState({
    // Total cylinders (Load)
    maxGas6kgLoad: 0,
    maxGas13kgLoad: 0,
    maxGas50kgLoad: 0,

    // MaxGas Returns (for refilling)
    return6kg: 0,
    return13kg: 0,
    return50kg: 0,

    // MaxGas Outright (full cylinders sold)
    outright6kg: 0,
    outright13kg: 0,
    outright50kg: 0,

    // Other company swipes
    swipeReturn6kg: 0,
    swipeReturn13kg: 0,
    swipeReturn50kg: 0,

    // Pricing
    refillPrice6kg: 135,
    refillPrice13kg: 135,
    refillPrice50kg: 135,
    outrightPrice6kg: 3200,
    outrightPrice13kg: 3500,
    outrightPrice50kg: 8500,
    swipeRefillPrice6kg: 160,
    swipeRefillPrice13kg: 160,
    swipeRefillPrice50kg: 160,

    // Payment
    paid: 0,
    paymentMethod: 'cash',
    notes: "",
  })

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Number(value) || 0,
    }))
  }

  const handleTextChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePaymentMethodChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: value,
    }))
  }

  const calculateTotal = () => {
    // MaxGas Refills - Price is per kg
    const refillTotal =
      formData.return6kg * 6 * formData.refillPrice6kg +
      formData.return13kg * 13 * formData.refillPrice13kg +
      formData.return50kg * 50 * formData.refillPrice50kg

    // MaxGas Outright - Price is per cylinder
    const outrightTotal =
      formData.outright6kg * formData.outrightPrice6kg +
      formData.outright13kg * formData.outrightPrice13kg +
      formData.outright50kg * formData.outrightPrice50kg

    // Swipes - Price is per kg
    const swipeTotal =
      formData.swipeReturn6kg * 6 * formData.swipeRefillPrice6kg +
      formData.swipeReturn13kg * 13 * formData.swipeRefillPrice13kg +
      formData.swipeReturn50kg * 50 * formData.swipeRefillPrice50kg

    return refillTotal + outrightTotal + swipeTotal
  }

  const total = calculateTotal()
  const outstanding = total - formData.paid

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prepare transaction data
    const transactionData = {
        ...formData,
        customerId: Number(customerId),
        date: new Date().toISOString(),
        total,
    }
    
    // Remove paymentMethod if no payment is being made
    if (formData.paid === 0) {
      delete transactionData.paymentMethod
    }
    
    try {
      await addTransaction(transactionData)
      
      onSuccess()
    } catch (error) {
      console.error('Failed to add transaction:', error)
      // You can add toast notification here if you want to show error to user
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Add Transaction
            </h1>
            <p className="text-gray-600">Customer: {customerName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Total Cylinders (Load) */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle>Total Cylinders (Load)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maxGas6kgLoad">6kg Cylinders</Label>
                  <Input
                    id="maxGas6kgLoad"
                    type="number"
                    min="0"
                    value={formData.maxGas6kgLoad}
                    onChange={(e) => handleInputChange("maxGas6kgLoad", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="maxGas13kgLoad">13kg Cylinders</Label>
                  <Input
                    id="maxGas13kgLoad"
                    type="number"
                    min="0"
                    value={formData.maxGas13kgLoad}
                    onChange={(e) => handleInputChange("maxGas13kgLoad", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="maxGas50kgLoad">50kg Cylinders</Label>
                  <Input
                    id="maxGas50kgLoad"
                    type="number"
                    min="0"
                    value={formData.maxGas50kgLoad}
                    onChange={(e) => handleInputChange("maxGas50kgLoad", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MaxGas Returns */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <CardTitle>MaxGas Returns (For Refilling)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="return6kg">6kg Returns</Label>
                  <Input
                    id="return6kg"
                    type="number"
                    min="0"
                    value={formData.return6kg}
                    onChange={(e) => handleInputChange("return6kg", e.target.value)}
                  />
                  <div className="flex items-center">
                    <Label htmlFor="refillPrice6kg" className="text-xs mr-2">
                      Price:
                    </Label>
                    <Input
                      id="refillPrice6kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.refillPrice6kg}
                      onChange={(e) => handleInputChange("refillPrice6kg", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Total: {formatCurrency(formData.return6kg * 6 * formData.refillPrice6kg)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return13kg">13kg Returns</Label>
                  <Input
                    id="return13kg"
                    type="number"
                    min="0"
                    value={formData.return13kg}
                    onChange={(e) => handleInputChange("return13kg", e.target.value)}
                  />
                  <div className="flex items-center">
                    <Label htmlFor="refillPrice13kg" className="text-xs mr-2">
                      Price:
                    </Label>
                    <Input
                      id="refillPrice13kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.refillPrice13kg}
                      onChange={(e) => handleInputChange("refillPrice13kg", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Total: {formatCurrency(formData.return13kg * 13 * formData.refillPrice13kg)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return50kg">50kg Returns</Label>
                  <Input
                    id="return50kg"
                    type="number"
                    min="0"
                    value={formData.return50kg}
                    onChange={(e) => handleInputChange("return50kg", e.target.value)}
                  />
                  <div className="flex items-center">
                    <Label htmlFor="refillPrice50kg" className="text-xs mr-2">
                      Price:
                    </Label>
                    <Input
                      id="refillPrice50kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.refillPrice50kg}
                      onChange={(e) => handleInputChange("refillPrice50kg", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Total: {formatCurrency(formData.return50kg * 50 * formData.refillPrice50kg)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MaxGas Outright */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardTitle>MaxGas Outright (Full Cylinders Sold)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outright6kg">6kg Outright</Label>
                  <Input
                    id="outright6kg"
                    type="number"
                    min="0"
                    value={formData.outright6kg}
                    onChange={(e) => handleInputChange("outright6kg", e.target.value)}
                  />
                  <div className="flex items-center">
                    <Label htmlFor="outrightPrice6kg" className="text-xs mr-2">
                      Price:
                    </Label>
                    <Input
                      id="outrightPrice6kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.outrightPrice6kg}
                      onChange={(e) => handleInputChange("outrightPrice6kg", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Total: {formatCurrency(formData.outright6kg * formData.outrightPrice6kg)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outright13kg">13kg Outright</Label>
                  <Input
                    id="outright13kg"
                    type="number"
                    min="0"
                    value={formData.outright13kg}
                    onChange={(e) => handleInputChange("outright13kg", e.target.value)}
                  />
                  <div className="flex items-center">
                    <Label htmlFor="outrightPrice13kg" className="text-xs mr-2">
                      Price:
                    </Label>
                    <Input
                      id="outrightPrice13kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.outrightPrice13kg}
                      onChange={(e) => handleInputChange("outrightPrice13kg", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Total: {formatCurrency(formData.outright13kg * formData.outrightPrice13kg)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outright50kg">50kg Outright</Label>
                  <Input
                    id="outright50kg"
                    type="number"
                    min="0"
                    value={formData.outright50kg}
                    onChange={(e) => handleInputChange("outright50kg", e.target.value)}
                  />
                  <div className="flex items-center">
                    <Label htmlFor="outrightPrice50kg" className="text-xs mr-2">
                      Price:
                    </Label>
                    <Input
                      id="outrightPrice50kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.outrightPrice50kg}
                      onChange={(e) => handleInputChange("outrightPrice50kg", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Total: {formatCurrency(formData.outright50kg * formData.outrightPrice50kg)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Company Swipes */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle>Other Company Swipes</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="swipeReturn6kg">6kg Swipes</Label>
                  <Input
                    id="swipeReturn6kg"
                    type="number"
                    min="0"
                    value={formData.swipeReturn6kg}
                    onChange={(e) => handleInputChange("swipeReturn6kg", e.target.value)}
                  />
                  <div className="flex items-center">
                    <Label htmlFor="swipeRefillPrice6kg" className="text-xs mr-2">
                      Price:
                    </Label>
                    <Input
                      id="swipeRefillPrice6kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.swipeRefillPrice6kg}
                      onChange={(e) => handleInputChange("swipeRefillPrice6kg", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Total: {formatCurrency(formData.swipeReturn6kg * 6 * formData.swipeRefillPrice6kg)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="swipeReturn13kg">13kg Swipes</Label>
                  <Input
                    id="swipeReturn13kg"
                    type="number"
                    min="0"
                    value={formData.swipeReturn13kg}
                    onChange={(e) => handleInputChange("swipeReturn13kg", e.target.value)}
                  />
                  <div className="flex items-center">
                    <Label htmlFor="swipeRefillPrice13kg" className="text-xs mr-2">
                      Price:
                    </Label>
                    <Input
                      id="swipeRefillPrice13kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.swipeRefillPrice13kg}
                      onChange={(e) => handleInputChange("swipeRefillPrice13kg", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Total: {formatCurrency(formData.swipeReturn13kg * 13 * formData.swipeRefillPrice13kg)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="swipeReturn50kg">50kg Swipes</Label>
                  <Input
                    id="swipeReturn50kg"
                    type="number"
                    min="0"
                    value={formData.swipeReturn50kg}
                    onChange={(e) => handleInputChange("swipeReturn50kg", e.target.value)}
                  />
                  <div className="flex items-center">
                    <Label htmlFor="swipeRefillPrice50kg" className="text-xs mr-2">
                      Price:
                    </Label>
                    <Input
                      id="swipeRefillPrice50kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.swipeRefillPrice50kg}
                      onChange={(e) => handleInputChange("swipeRefillPrice50kg", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Total: {formatCurrency(formData.swipeReturn50kg * 50 * formData.swipeRefillPrice50kg)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Payment & Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paid">Amount Paid</Label>
                  <Input
                    id="paid"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.paid}
                    onChange={(e) => handleInputChange("paid", e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleInputChange("paid", total)}>
                      Full Amount
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleInputChange("paid", 0)}>
                      No Payment
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="paymentMethod">
                    Payment Method
                    {formData.paid === 0 && (
                      <span className="text-sm text-gray-500 ml-2">(Not required for credit transactions)</span>
                    )}
                  </Label>
                  <select
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    disabled={formData.paid === 0}
                    className={`w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      formData.paid === 0 ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="credit">Credit</option>
                  </select>
                  {formData.paid === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Payment method will be set to "Credit" when no payment is made
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Transaction notes"
                    value={formData.notes}
                    onChange={(e) => handleTextChange("notes", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle>Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Amount Paid</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(formData.paid)}</p>
                </div>
                <div className={`p-4 rounded-lg ${outstanding > 0 ? "bg-red-50" : "bg-green-50"}`}>
                  <p className="text-sm text-gray-600">Outstanding</p>
                  <p className={`text-2xl font-bold ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(outstanding)}
                  </p>
                </div>
              </div>
              
              {/* Payment Status Information */}
              {outstanding > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Partial Payment Transaction
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>• Customer will owe {formatCurrency(outstanding)} after this transaction</p>
                        <p>• Remaining balance can be paid later using the "Record Payment" feature</p>
                        <p>• Transaction will be marked as "Credit" payment method</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {formData.paid === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Credit Transaction
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>• No immediate payment required</p>
                        <p>• Customer will owe {formatCurrency(total)} after this transaction</p>
                        <p>• Payment can be recorded later using the "Record Payment" feature</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Transaction
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
