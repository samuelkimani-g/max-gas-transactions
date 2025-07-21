"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ArrowLeft, Save, Calculator, AlertCircle } from "lucide-react"
import { useStore } from "../lib/store"
import { formatCurrency } from "../lib/calculations"

export default function AddTransactionForm({ customerId, customerName, onBack, onSuccess }) {
  const { addTransaction } = useStore()
  const [formData, setFormData] = useState({
    // Total cylinders (Load) - PRIMARY DEBT
    maxGas6kgLoad: '',
    maxGas13kgLoad: '',
    maxGas50kgLoad: '',

    // MaxGas Returns (for refilling) - CREDITS AGAINST DEBT
    return6kg: '',
    return13kg: '',
    return50kg: '',

    // MaxGas Outright (full cylinders sold) - CREDITS AGAINST DEBT
    outright6kg: '',
    outright13kg: '',
    outright50kg: '',

    // Other company swipes - CREDITS AGAINST DEBT
    swipeReturn6kg: '',
    swipeReturn13kg: '',
    swipeReturn50kg: '',

    // Pricing (can be adjusted per transaction)
    refillPrice6kg: 135,
    refillPrice13kg: 135,
    refillPrice50kg: 135,
    outrightPrice6kg: 2200,
    outrightPrice13kg: 4400,
    outrightPrice50kg: 8000,
    swipeRefillPrice6kg: 160,
    swipeRefillPrice13kg: 160,
    swipeRefillPrice50kg: 160,

    // Payment
    paid: '',
    paymentMethod: 'cash',
    notes: "",
  })

  // Enhanced input handler with proper cursor behavior
  const handleInputChange = (field, value) => {
    // Convert empty string or 0 to empty string for better UX
    const numValue = value === '' || value === '0' ? '' : value
    setFormData((prev) => ({
      ...prev,
      [field]: numValue,
    }))
  }

  // Handle input focus - clear field if it's 0
  const handleInputFocus = (field) => {
    if (formData[field] === 0 || formData[field] === '0') {
      setFormData((prev) => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  // Handle input blur - set to 0 if empty
  const handleInputBlur = (field) => {
    if (formData[field] === '' || formData[field] === null) {
      setFormData((prev) => ({
        ...prev,
        [field]: 0,
      }))
    }
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

  // SOLUTION 1: Load-First Calculation System
  const calculateLoadDebt = () => {
    // Total debt based on load (cylinders taken)
    const load6kg = Number(formData.maxGas6kgLoad) || 0
    const load13kg = Number(formData.maxGas13kgLoad) || 0
    const load50kg = Number(formData.maxGas50kgLoad) || 0

    // Load creates debt at refill prices (default pricing for cylinders taken)
    const loadDebt = 
      (load6kg * formData.refillPrice6kg) +
      (load13kg * formData.refillPrice13kg) + 
      (load50kg * formData.refillPrice50kg)

    return {
      totalCylinders: load6kg + load13kg + load50kg,
      totalDebt: loadDebt,
      breakdown: {
        load6kg: load6kg * formData.refillPrice6kg,
        load13kg: load13kg * formData.refillPrice13kg,
        load50kg: load50kg * formData.refillPrice50kg
      }
    }
  }

  const calculateCredits = () => {
    // Credits from returns (customer's own cylinders for refilling)
    const returnCredits =
      (Number(formData.return6kg) || 0) * formData.refillPrice6kg +
      (Number(formData.return13kg) || 0) * formData.refillPrice13kg +
      (Number(formData.return50kg) || 0) * formData.refillPrice50kg

    // Credits from outright purchases (new cylinders bought)
    const outrightCredits =
      (Number(formData.outright6kg) || 0) * formData.outrightPrice6kg +
      (Number(formData.outright13kg) || 0) * formData.outrightPrice13kg +
      (Number(formData.outright50kg) || 0) * formData.outrightPrice50kg

    // Credits from swipes (other company cylinders)
    const swipeCredits =
      (Number(formData.swipeReturn6kg) || 0) * formData.swipeRefillPrice6kg +
      (Number(formData.swipeReturn13kg) || 0) * formData.swipeRefillPrice13kg +
      (Number(formData.swipeReturn50kg) || 0) * formData.swipeRefillPrice50kg

    // Cash payment credits
    const cashCredits = Number(formData.paid) || 0

    return {
      returnCredits,
      outrightCredits, 
      swipeCredits,
      cashCredits,
      totalCredits: returnCredits + outrightCredits + swipeCredits + cashCredits
    }
  }

  // Calculate final balance using Load-First approach
  const loadDebt = calculateLoadDebt()
  const credits = calculateCredits()
  const balance = loadDebt.totalDebt - credits.totalCredits

  // Cylinder accountability check
  const totalCylindersReturned = 
    (Number(formData.return6kg) || 0) + 
    (Number(formData.return13kg) || 0) + 
    (Number(formData.return50kg) || 0) +
    (Number(formData.outright6kg) || 0) + 
    (Number(formData.outright13kg) || 0) + 
    (Number(formData.outright50kg) || 0) +
    (Number(formData.swipeReturn6kg) || 0) + 
    (Number(formData.swipeReturn13kg) || 0) + 
    (Number(formData.swipeReturn50kg) || 0)

  const cylinderDiscrepancy = loadDebt.totalCylinders - totalCylindersReturned
  const cashEquivalentNeeded = cylinderDiscrepancy * 135 // Assume 135 per cylinder for remaining debt

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation: Ensure load is entered
    if (loadDebt.totalCylinders === 0) {
      alert('Please enter the load (total cylinders taken)')
      return
    }
    
    // Prepare transaction data with Load-First approach
    const transactionData = {
      // Convert all string inputs to numbers
      maxGas6kgLoad: Number(formData.maxGas6kgLoad) || 0,
      maxGas13kgLoad: Number(formData.maxGas13kgLoad) || 0,
      maxGas50kgLoad: Number(formData.maxGas50kgLoad) || 0,
      return6kg: Number(formData.return6kg) || 0,
      return13kg: Number(formData.return13kg) || 0,
      return50kg: Number(formData.return50kg) || 0,
      outright6kg: Number(formData.outright6kg) || 0,
      outright13kg: Number(formData.outright13kg) || 0,
      outright50kg: Number(formData.outright50kg) || 0,
      swipeReturn6kg: Number(formData.swipeReturn6kg) || 0,
      swipeReturn13kg: Number(formData.swipeReturn13kg) || 0,
      swipeReturn50kg: Number(formData.swipeReturn50kg) || 0,
      
      // Pricing
      refillPrice6kg: formData.refillPrice6kg,
      refillPrice13kg: formData.refillPrice13kg,
      refillPrice50kg: formData.refillPrice50kg,
      outrightPrice6kg: formData.outrightPrice6kg,
      outrightPrice13kg: formData.outrightPrice13kg,
      outrightPrice50kg: formData.outrightPrice50kg,
      swipeRefillPrice6kg: formData.swipeRefillPrice6kg,
      swipeRefillPrice13kg: formData.swipeRefillPrice13kg,
      swipeRefillPrice50kg: formData.swipeRefillPrice50kg,
      
      // Payment and totals
      paid: Number(formData.paid) || 0,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
      
      // Load-First calculation results
      customerId: Number(customerId),
      date: new Date().toISOString(),
      total: loadDebt.totalDebt, // Total debt from load
      balance: balance, // Remaining balance after credits
      
      // Additional tracking fields
      loadDebt: loadDebt.totalDebt,
      totalCredits: credits.totalCredits,
      cylinderDiscrepancy: cylinderDiscrepancy
    }
    
    try {
      await addTransaction(transactionData)
      onSuccess()
    } catch (error) {
      console.error('Failed to add transaction:', error)
      alert('Failed to add transaction. Please try again.')
    }
  }

  // Enhanced Input component with proper cursor behavior
  const EnhancedInput = ({ field, label, ...props }) => (
    <div>
      <Label htmlFor={field}>{label}</Label>
      <Input
        id={field}
        type="number"
        min="0"
        value={formData[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        onFocus={() => handleInputFocus(field)}
        onBlur={() => handleInputBlur(field)}
        placeholder="0"
        className="text-right"
        {...props}
      />
    </div>
  )

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
              Add Transaction - Load-First System
            </h1>
            <p className="text-gray-600">Customer: {customerName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Load Calculation Summary */}
          <Card className="shadow-lg border-2 border-orange-200 bg-orange-50">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Load-First Calculation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Total Load Debt</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(loadDebt.totalDebt)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {loadDebt.totalCylinders} cylinders
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Total Credits</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(credits.totalCredits)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {totalCylindersReturned} cylinders returned
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Final Balance</div>
                  <div className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {formatCurrency(Math.abs(balance))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {balance > 0 ? 'Owed' : balance < 0 ? 'Credit' : 'Paid'}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600">Cylinder Gap</div>
                  <div className={`text-2xl font-bold ${cylinderDiscrepancy > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {cylinderDiscrepancy}
                  </div>
                  <div className="text-xs text-gray-500">
                    {cylinderDiscrepancy > 0 ? 'Missing' : 'Balanced'}
                  </div>
                </div>
              </div>
              
              {cylinderDiscrepancy > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center text-yellow-800">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="font-semibold">Cylinder Accountability Alert:</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    {cylinderDiscrepancy} cylinders from load are not accounted for in returns/swipes/outright. 
                    Cash equivalent needed: {formatCurrency(cashEquivalentNeeded)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Cylinders (Load) - PRIMARY DEBT */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardTitle>🚛 LOAD: Total Cylinders Taken (Creates Debt)</CardTitle>
              <p className="text-red-100 text-sm">This is what the customer owes for - every cylinder taken must be accounted for!</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <EnhancedInput field="maxGas6kgLoad" label="6kg Load" />
                  <div className="text-xs text-gray-500">
                    Debt: {formatCurrency((Number(formData.maxGas6kgLoad) || 0) * formData.refillPrice6kg)}
                  </div>
                </div>
                <div className="space-y-2">
                  <EnhancedInput field="maxGas13kgLoad" label="13kg Load" />
                  <div className="text-xs text-gray-500">
                    Debt: {formatCurrency((Number(formData.maxGas13kgLoad) || 0) * formData.refillPrice13kg)}
                  </div>
                </div>
                <div className="space-y-2">
                  <EnhancedInput field="maxGas50kgLoad" label="50kg Load" />
                  <div className="text-xs text-gray-500">
                    Debt: {formatCurrency((Number(formData.maxGas50kgLoad) || 0) * formData.refillPrice50kg)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MaxGas Returns - CREDITS */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <CardTitle>🔄 MaxGas Returns (Credits Against Debt)</CardTitle>
              <p className="text-green-100 text-sm">Customer's own cylinders returned for refilling</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <EnhancedInput field="return6kg" label="6kg Returns" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="refillPrice6kg" className="text-xs">Price:</Label>
                    <Input
                      id="refillPrice6kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.refillPrice6kg}
                      onChange={(e) => handleInputChange("refillPrice6kg", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="text-xs text-green-600">
                    Credit: {formatCurrency((Number(formData.return6kg) || 0) * formData.refillPrice6kg)}
                  </div>
                </div>
                <div className="space-y-2">
                  <EnhancedInput field="return13kg" label="13kg Returns" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="refillPrice13kg" className="text-xs">Price:</Label>
                    <Input
                      id="refillPrice13kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.refillPrice13kg}
                      onChange={(e) => handleInputChange("refillPrice13kg", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="text-xs text-green-600">
                    Credit: {formatCurrency((Number(formData.return13kg) || 0) * formData.refillPrice13kg)}
                  </div>
                </div>
                <div className="space-y-2">
                  <EnhancedInput field="return50kg" label="50kg Returns" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="refillPrice50kg" className="text-xs">Price:</Label>
                    <Input
                      id="refillPrice50kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.refillPrice50kg}
                      onChange={(e) => handleInputChange("refillPrice50kg", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="text-xs text-green-600">
                    Credit: {formatCurrency((Number(formData.return50kg) || 0) * formData.refillPrice50kg)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outright Purchases - CREDITS */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardTitle>🛒 Outright Purchases (Credits Against Debt)</CardTitle>
              <p className="text-blue-100 text-sm">New cylinders customer buys</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <EnhancedInput field="outright6kg" label="6kg Outright" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="outrightPrice6kg" className="text-xs">Price:</Label>
                    <Input
                      id="outrightPrice6kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.outrightPrice6kg}
                      onChange={(e) => handleInputChange("outrightPrice6kg", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="text-xs text-blue-600">
                    Credit: {formatCurrency((Number(formData.outright6kg) || 0) * formData.outrightPrice6kg)}
                  </div>
                </div>
                <div className="space-y-2">
                  <EnhancedInput field="outright13kg" label="13kg Outright" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="outrightPrice13kg" className="text-xs">Price:</Label>
                    <Input
                      id="outrightPrice13kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.outrightPrice13kg}
                      onChange={(e) => handleInputChange("outrightPrice13kg", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="text-xs text-blue-600">
                    Credit: {formatCurrency((Number(formData.outright13kg) || 0) * formData.outrightPrice13kg)}
                  </div>
                </div>
                <div className="space-y-2">
                  <EnhancedInput field="outright50kg" label="50kg Outright" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="outrightPrice50kg" className="text-xs">Price:</Label>
                    <Input
                      id="outrightPrice50kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.outrightPrice50kg}
                      onChange={(e) => handleInputChange("outrightPrice50kg", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="text-xs text-blue-600">
                    Credit: {formatCurrency((Number(formData.outright50kg) || 0) * formData.outrightPrice50kg)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Swipes - CREDITS */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <CardTitle>🔄 Swipes (Credits Against Debt)</CardTitle>
              <p className="text-purple-100 text-sm">Other company cylinders brought for exchange</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <EnhancedInput field="swipeReturn6kg" label="6kg Swipes" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="swipeRefillPrice6kg" className="text-xs">Price:</Label>
                    <Input
                      id="swipeRefillPrice6kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.swipeRefillPrice6kg}
                      onChange={(e) => handleInputChange("swipeRefillPrice6kg", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="text-xs text-purple-600">
                    Credit: {formatCurrency((Number(formData.swipeReturn6kg) || 0) * formData.swipeRefillPrice6kg)}
                  </div>
                </div>
                <div className="space-y-2">
                  <EnhancedInput field="swipeReturn13kg" label="13kg Swipes" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="swipeRefillPrice13kg" className="text-xs">Price:</Label>
                    <Input
                      id="swipeRefillPrice13kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.swipeRefillPrice13kg}
                      onChange={(e) => handleInputChange("swipeRefillPrice13kg", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="text-xs text-purple-600">
                    Credit: {formatCurrency((Number(formData.swipeReturn13kg) || 0) * formData.swipeRefillPrice13kg)}
                  </div>
                </div>
                <div className="space-y-2">
                  <EnhancedInput field="swipeReturn50kg" label="50kg Swipes" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="swipeRefillPrice50kg" className="text-xs">Price:</Label>
                    <Input
                      id="swipeRefillPrice50kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.swipeRefillPrice50kg}
                      onChange={(e) => handleInputChange("swipeRefillPrice50kg", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="text-xs text-purple-600">
                    Credit: {formatCurrency((Number(formData.swipeReturn50kg) || 0) * formData.swipeRefillPrice50kg)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
              <CardTitle>💰 Cash Payment (Credit Against Debt)</CardTitle>
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
                    onFocus={() => handleInputFocus("paid")}
                    onBlur={() => handleInputBlur("paid")}
                    placeholder="0.00"
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>📝 Notes</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <textarea
                value={formData.notes}
                onChange={(e) => handleTextChange("notes", e.target.value)}
                placeholder="Additional notes about this transaction..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" onClick={onBack} variant="outline">
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
              <Save className="w-4 h-4 mr-2" />
              Save Transaction
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
