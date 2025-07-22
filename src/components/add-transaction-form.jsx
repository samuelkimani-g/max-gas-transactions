"use client"

import { useState, useMemo, useEffect } from "react"
import { useStore } from "../lib/store"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card"
import { ArrowLeft, Save, AlertTriangle, ChevronsRight, Minus, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Textarea } from "./ui/textarea"

// --- Helper Components for a cleaner structure ---

const SectionCard = ({ title, description, children }) => (
  <Card className="border border-gray-200 bg-white">
    <CardHeader className="bg-orange-500 text-white">
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      {description && (
        <CardDescription className="text-orange-100">{description}</CardDescription>
      )}
    </CardHeader>
    <CardContent className="p-6">
      {children}
    </CardContent>
  </Card>
)

const BreakdownInput = ({ name, value, price, onCountChange, onPriceChange, placeholder = "0" }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/70 border border-orange-100 hover:bg-white/90 transition-colors">
    <Label htmlFor={`${name}-count`} className="w-20 text-sm font-medium text-orange-700">{name}</Label>
    <Input
      id={`${name}-count`}
      type="number"
      placeholder={placeholder}
      value={value === 0 ? '' : value}
      onChange={(e) => onCountChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
      onFocus={(e) => e.target.select()}
      className="text-right flex-1 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
    />
    <Label htmlFor={`${name}-price`} className="text-orange-600 font-medium">@</Label>
    <Input
      id={`${name}-price`}
      type="number"
      placeholder="0.00"
      value={price === 0 ? '' : price}
      onChange={(e) => onPriceChange(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
      onFocus={(e) => e.target.select()}
      className="text-right w-24 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
    />
  </div>
)

const LiveSummary = ({ summary }) => (
  <Card className="border border-gray-200 bg-white">
    <CardHeader className="bg-orange-500 text-white">
      <CardTitle className="text-lg font-semibold">Transaction Summary</CardTitle>
    </CardHeader>
    <CardContent className="p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-xl font-bold text-gray-900">
            Ksh {isNaN(summary.financialBalance) ? 0 : summary.financialBalance.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Financial Balance</div>
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900">
            Ksh {isNaN(summary.totalBill) ? 0 : summary.totalBill.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Bill</div>
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900">
            {summary.cylinderBalance || 0}
          </div>
          <div className="text-sm text-gray-600">Cylinder Balance</div>
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900">
            Ksh {summary.amountPaid.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Amount Paid</div>
        </div>
      </div>
    </CardContent>
  </Card>
)

// --- Main Transaction Form Component ---

export default function AddTransactionForm({ customerId, customerName, onBack, onSuccess }) {
  const { addTransaction } = useStore()
  const [totalReturns, setTotalReturns] = useState(0)
  const [totalLoad, setTotalLoad] = useState(0)
  const [amountPaid, setAmountPaid] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  // Detailed load tracking
  const [loadBreakdown, setLoadBreakdown] = useState({
    kg6: 0,
    kg13: 0,
    kg50: 0
  })

  const [returnsBreakdown, setReturnsBreakdown] = useState({
    max_empty: { kg6: 0, kg13: 0, kg50: 0, price6: 135, price13: 135, price50: 135 },
    swap_empty: { kg6: 0, kg13: 0, kg50: 0, price6: 160, price13: 160, price50: 160 },
    return_full: { kg6: 0, kg13: 0, kg50: 0 },
  })

  const [outrightBreakdown, setOutrightBreakdown] = useState({
    kg6: { count: 0, price: 2200 },
    kg13: { count: 0, price: 4400 },
    kg50: { count: 0, price: 8000 },
  })
  
  const handleLoadChange = (size, value) => {
    setLoadBreakdown(prev => ({
      ...prev,
      [size]: value
    }))
  }
  
  const handleBreakdownChange = (setBreakdown, category, field, value) => {
    setBreakdown(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }))
  }

  const summary = useMemo(() => {
    const maxEmptyTotal = (returnsBreakdown.max_empty.kg6 * returnsBreakdown.max_empty.price6) +
                         (returnsBreakdown.max_empty.kg13 * returnsBreakdown.max_empty.price13) +
                         (returnsBreakdown.max_empty.kg50 * returnsBreakdown.max_empty.price50)
    
    const swapEmptyTotal = (returnsBreakdown.swap_empty.kg6 * returnsBreakdown.swap_empty.price6) +
                          (returnsBreakdown.swap_empty.kg13 * returnsBreakdown.swap_empty.price13) +
                          (returnsBreakdown.swap_empty.kg50 * returnsBreakdown.swap_empty.price50)
    
    const outrightTotal = (outrightBreakdown.kg6.count * outrightBreakdown.kg6.price) +
                         (outrightBreakdown.kg13.count * outrightBreakdown.kg13.price) +
                         (outrightBreakdown.kg50.count * outrightBreakdown.kg50.price)
    
    const totalBill = maxEmptyTotal + swapEmptyTotal + outrightTotal
    const financialBalance = totalBill - amountPaid

    // Calculate detailed cylinder balance by size
    const cylinderBalance_6kg = loadBreakdown.kg6 - (returnsBreakdown.max_empty.kg6 + returnsBreakdown.swap_empty.kg6 + returnsBreakdown.return_full.kg6 + outrightBreakdown.kg6.count)
    const cylinderBalance_13kg = loadBreakdown.kg13 - (returnsBreakdown.max_empty.kg13 + returnsBreakdown.swap_empty.kg13 + returnsBreakdown.return_full.kg13 + outrightBreakdown.kg13.count)
    const cylinderBalance_50kg = loadBreakdown.kg50 - (returnsBreakdown.max_empty.kg50 + returnsBreakdown.swap_empty.kg50 + returnsBreakdown.return_full.kg50 + outrightBreakdown.kg50.count)
    const cylinderBalance = cylinderBalance_6kg + cylinderBalance_13kg + cylinderBalance_50kg

    return {
      totalBill,
      financialBalance,
      cylinderBalance,
      cylinderBalance_6kg,
      cylinderBalance_13kg,
      cylinderBalance_50kg,
      amountPaid
    }
  }, [loadBreakdown, returnsBreakdown, outrightBreakdown, amountPaid])

  // Auto-calculate totals from breakdowns
  const calculatedTotalReturns = useMemo(() => {
    return returnsBreakdown.max_empty.kg6 + returnsBreakdown.max_empty.kg13 + returnsBreakdown.max_empty.kg50 +
           returnsBreakdown.swap_empty.kg6 + returnsBreakdown.swap_empty.kg13 + returnsBreakdown.swap_empty.kg50 +
           returnsBreakdown.return_full.kg6 + returnsBreakdown.return_full.kg13 + returnsBreakdown.return_full.kg50;
  }, [returnsBreakdown]);

  const calculatedTotalLoad = useMemo(() => {
    return loadBreakdown.kg6 + loadBreakdown.kg13 + loadBreakdown.kg50;
  }, [loadBreakdown]);

  // Auto-update totals when breakdowns change
  useEffect(() => {
    setTotalReturns(calculatedTotalReturns);
  }, [calculatedTotalReturns]);

  useEffect(() => {
    setTotalLoad(calculatedTotalLoad);
  }, [calculatedTotalLoad]);

  const validateAndSubmit = async () => {
    setError('');
    
    // Calculate actual returns sum from breakdown
    const returnsSum = 
      returnsBreakdown.max_empty.kg6 + returnsBreakdown.max_empty.kg13 + returnsBreakdown.max_empty.kg50 +
      returnsBreakdown.swap_empty.kg6 + returnsBreakdown.swap_empty.kg13 + returnsBreakdown.swap_empty.kg50 +
      returnsBreakdown.return_full.kg6 + returnsBreakdown.return_full.kg13 + returnsBreakdown.return_full.kg50;

    if (returnsSum !== totalReturns) {
      setError(`The sum of the returns breakdown (${returnsSum}) does not match the Total Returns count (${totalReturns}).`);
      return;
    }

    const transactionData = {
      customerId,
      date: new Date().toISOString(),
      total_returns: totalReturns,
      total_load: totalLoad,
      returns_breakdown: returnsBreakdown,
      outright_breakdown: outrightBreakdown,
      amount_paid: amountPaid,
      payment_method: paymentMethod,
      notes
    };

    try {
      await addTransaction(transactionData);
      onSuccess();
    } catch (apiError) {
      setError(apiError.message || 'Failed to create transaction. Please check the details and try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-25 to-white p-6 space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <Button onClick={onBack} variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-50">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-orange-900">Add Transaction</h1>
          <p className="text-orange-600 text-lg">Customer: <span className="font-semibold">{customerName}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SectionCard title="Step 1: Cylinders IN" description="What the customer brought into the compound (detailed breakdown).">
          <div className="space-y-6">
            {/* Max Empty */}
            <div className="bg-white p-4 rounded border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3">Max Empty</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-gray-700">6kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.max_empty.kg6 === 0 ? '' : returnsBreakdown.max_empty.kg6}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg6', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-gray-600 text-sm">@ Ksh</span>
                  <Input
                    type="number"
                    value={returnsBreakdown.max_empty.price6}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'price6', parseFloat(e.target.value) || 0)}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-gray-700">13kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.max_empty.kg13 === 0 ? '' : returnsBreakdown.max_empty.kg13}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg13', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-gray-600 text-sm">@ Ksh</span>
                  <Input
                    type="number"
                    value={returnsBreakdown.max_empty.price13}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'price13', parseFloat(e.target.value) || 0)}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-gray-700">50kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.max_empty.kg50 === 0 ? '' : returnsBreakdown.max_empty.kg50}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg50', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-gray-600 text-sm">@ Ksh</span>
                  <Input
                    type="number"
                    value={returnsBreakdown.max_empty.price50}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'price50', parseFloat(e.target.value) || 0)}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
              </div>
            </div>

            {/* Swap Empty */}
            <div className="bg-white p-4 rounded border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3">Swap Empty</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-gray-700">6kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.swap_empty.kg6 === 0 ? '' : returnsBreakdown.swap_empty.kg6}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg6', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-gray-600 text-sm">@ Ksh</span>
                  <Input
                    type="number"
                    value={returnsBreakdown.swap_empty.price6}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'price6', parseFloat(e.target.value) || 0)}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-gray-700">13kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.swap_empty.kg13 === 0 ? '' : returnsBreakdown.swap_empty.kg13}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg13', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-gray-600 text-sm">@ Ksh</span>
                  <Input
                    type="number"
                    value={returnsBreakdown.swap_empty.price13}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'price13', parseFloat(e.target.value) || 0)}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-gray-700">50kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.swap_empty.kg50 === 0 ? '' : returnsBreakdown.swap_empty.kg50}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg50', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-gray-600 text-sm">@ Ksh</span>
                  <Input
                    type="number"
                    value={returnsBreakdown.swap_empty.price50}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'price50', parseFloat(e.target.value) || 0)}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
              </div>
            </div>

            {/* Return Full */}
            <div className="bg-white p-4 rounded border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3">Return Full</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-gray-700">6kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.return_full.kg6 === 0 ? '' : returnsBreakdown.return_full.kg6}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg6', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-gray-600 text-sm">cylinders</span>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-gray-700">13kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.return_full.kg13 === 0 ? '' : returnsBreakdown.return_full.kg13}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg13', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-gray-600 text-sm">cylinders</span>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-gray-700">50kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.return_full.kg50 === 0 ? '' : returnsBreakdown.return_full.kg50}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg50', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-gray-600 text-sm">cylinders</span>
                </div>
              </div>
            </div>

            {/* Total Returns Summary */}
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">Total Returns (Cylinders):</span>
                <span className="text-xl font-bold text-gray-900">{calculatedTotalReturns} cylinders</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">Total cylinders brought in</div>
            </div>
          </div>
        </SectionCard>
        
        <SectionCard title="Step 2: Cylinders BOUGHT" description="Brand-new cylinders purchased separately.">
          <div className="space-y-2">
            <BreakdownInput name="6kg Outright" value={outrightBreakdown.kg6.count} price={outrightBreakdown.kg6.price} onCountChange={v => handleBreakdownChange(setOutrightBreakdown, 'kg6', 'count', v)} onPriceChange={v => handleBreakdownChange(setOutrightBreakdown, 'kg6', 'price', v)} />
            <BreakdownInput name="13kg Outright" value={outrightBreakdown.kg13.count} price={outrightBreakdown.kg13.price} onCountChange={v => handleBreakdownChange(setOutrightBreakdown, 'kg13', 'count', v)} onPriceChange={v => handleBreakdownChange(setOutrightBreakdown, 'kg13', 'price', v)} />
            <BreakdownInput name="50kg Outright" value={outrightBreakdown.kg50.count} price={outrightBreakdown.kg50.price} onCountChange={v => handleBreakdownChange(setOutrightBreakdown, 'kg50', 'count', v)} onPriceChange={v => handleBreakdownChange(setOutrightBreakdown, 'kg50', 'price', v)} />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Step 3: Cylinders OUT" description="What the customer left the compound with.">
        <div className="space-y-6">
          <div>
            <Label className="text-orange-700 font-medium text-lg">Cylinder Load Breakdown</Label>
            <p className="text-sm text-orange-600 mb-4">Cylinders given to the customer</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/70 border border-orange-100">
              <Label className="w-20 text-sm font-medium text-orange-700">6kg</Label>
              <Input
                type="number"
                value={loadBreakdown.kg6 === 0 ? '' : loadBreakdown.kg6}
                onChange={e => handleLoadChange('kg6', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                onFocus={(e) => e.target.select()}
                className="flex-1 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                placeholder="0"
              />
              <span className="text-orange-600 text-sm">cylinders</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/70 border border-orange-100">
              <Label className="w-20 text-sm font-medium text-orange-700">13kg</Label>
              <Input
                type="number"
                value={loadBreakdown.kg13 === 0 ? '' : loadBreakdown.kg13}
                onChange={e => handleLoadChange('kg13', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                onFocus={(e) => e.target.select()}
                className="flex-1 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                placeholder="0"
              />
              <span className="text-orange-600 text-sm">cylinders</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/70 border border-orange-100">
              <Label className="w-20 text-sm font-medium text-orange-700">50kg</Label>
              <Input
                type="number"
                value={loadBreakdown.kg50 === 0 ? '' : loadBreakdown.kg50}
                onChange={e => handleLoadChange('kg50', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                onFocus={(e) => e.target.select()}
                className="flex-1 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                placeholder="0"
              />
              <span className="text-orange-600 text-sm">cylinders</span>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-orange-100 rounded-lg border-l-4 border-orange-500">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-orange-800">Total Load:</span>
              <span className="text-2xl font-bold text-orange-900">{totalLoad} cylinders</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Step 4: Payment" description="Settle the financial balance.">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount-paid" className="text-gray-700 font-medium">Amount Paid</Label>
            <Input
              id="amount-paid" 
              type="number" 
              value={amountPaid || ''} 
              onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} 
              placeholder="0" 
              className="mt-2 border-gray-300 focus:border-orange-400 focus:ring-orange-200 text-lg font-semibold"
            />
          </div>
          <div>
            <Label htmlFor="payment-method" className="text-gray-700 font-medium">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="mt-2 border-gray-300 focus:border-orange-400 focus:ring-orange-200">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="notes" className="text-gray-700 font-medium">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional transaction notes..."
            className="mt-2 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
            rows={3}
          />
        </div>
      </SectionCard>

      <LiveSummary summary={summary} />

      {error && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-800 rounded-lg flex items-center gap-3 shadow-md">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="font-medium">{error}</div>
        </div>
      )}

      <div className="flex justify-end gap-4 pt-8 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button
          onClick={validateAndSubmit}
          disabled={calculatedTotalReturns > calculatedTotalLoad}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Save Transaction
        </Button>
      </div>
    </div>
  )
}
