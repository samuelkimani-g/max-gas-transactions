"use client"

import { useState, useMemo, useEffect } from "react"
import { useStore } from "../lib/store"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card"
import { ArrowLeft, Save, AlertTriangle, ChevronsRight, Minus, Plus } from "lucide-react"

// --- Helper Components for a cleaner structure ---

const SectionCard = ({ title, description, children }) => (
  <Card className="shadow-lg border-orange-200 bg-gradient-to-br from-white to-orange-50 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="pb-4">
      <CardTitle className="text-orange-800 text-lg font-semibold">{title}</CardTitle>
      {description && <CardDescription className="text-orange-600">{description}</CardDescription>}
    </CardHeader>
    <CardContent className="pt-2">{children}</CardContent>
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
  <Card className="shadow-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100 sticky top-4 z-10">
    <CardHeader className="pb-4">
      <CardTitle className="text-orange-900 text-xl font-bold flex items-center gap-2">
        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
        Live Transaction Summary
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-white/70 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-800">
            {isNaN(summary.financialBalance) ? 0 : summary.financialBalance.toFixed(2)}
          </div>
          <div className="text-sm text-orange-600">
            {summary.financialBalance > 0 ? 'Credit' : 'Debt'}
          </div>
          <div className="text-xs text-orange-500 font-medium">Financial Balance</div>
        </div>
        <div className="text-center p-3 bg-white/70 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-800">
            {isNaN(summary.totalBill) ? 0 : summary.totalBill.toFixed(2)}
          </div>
          <div className="text-xs text-orange-500 font-medium">Total Bill</div>
        </div>
      </div>
      
      {/* Detailed Cylinder Balance */}
      <div className="bg-white/50 p-3 rounded-lg border border-orange-200">
        <div className="text-sm font-semibold text-orange-800 mb-3">Cylinder Balance Breakdown</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-white/70 rounded border border-orange-100">
            <div className={`text-lg font-bold ${summary.cylinderBalance_6kg > 0 ? 'text-red-600' : summary.cylinderBalance_6kg < 0 ? 'text-green-600' : 'text-orange-800'}`}>
              {summary.cylinderBalance_6kg || 0}
            </div>
            <div className="text-orange-600">6kg</div>
          </div>
          <div className="text-center p-2 bg-white/70 rounded border border-orange-100">
            <div className={`text-lg font-bold ${summary.cylinderBalance_13kg > 0 ? 'text-red-600' : summary.cylinderBalance_13kg < 0 ? 'text-green-600' : 'text-orange-800'}`}>
              {summary.cylinderBalance_13kg || 0}
            </div>
            <div className="text-orange-600">13kg</div>
          </div>
          <div className="text-center p-2 bg-white/70 rounded border border-orange-100">
            <div className={`text-lg font-bold ${summary.cylinderBalance_50kg > 0 ? 'text-red-600' : summary.cylinderBalance_50kg < 0 ? 'text-green-600' : 'text-orange-800'}`}>
              {summary.cylinderBalance_50kg || 0}
            </div>
            <div className="text-orange-600">50kg</div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-orange-200 text-center">
          <div className={`text-xl font-bold ${summary.cylinderBalance > 0 ? 'text-red-600' : summary.cylinderBalance < 0 ? 'text-green-600' : 'text-orange-800'}`}>
            {summary.cylinderBalance || 0}
          </div>
          <div className="text-xs text-orange-600">Total Cylinder Balance</div>
        </div>
      </div>
      
      <div className="text-center p-3 bg-white/70 rounded-lg border border-orange-200">
        <div className="text-2xl font-bold text-orange-800">
          {summary.amountPaid.toFixed(2)}
        </div>
        <div className="text-xs text-orange-500 font-medium">Amount Paid</div>
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

      <LiveSummary summary={summary} />
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-800 rounded-lg flex items-center gap-3 shadow-md">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="font-medium">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SectionCard title="Step 1: Cylinders IN" description="What the customer brought into the compound.">
          <div className="space-y-6">
            <div>
              <Label htmlFor="total-returns" className="text-orange-700 font-medium">Total Returns (Cylinders)</Label>
              <Input 
                id="total-returns" 
                type="number" 
                value={totalReturns || ''} 
                onChange={e => setTotalReturns(parseInt(e.target.value, 10) || 0)} 
                placeholder="Total cylinders brought in" 
                className="mt-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 text-lg font-semibold"
              />
            </div>
            <div className="space-y-3 pl-4 border-l-4 border-orange-200">
              <h4 className="font-semibold text-orange-800 text-lg">Returns Breakdown</h4>
              
              <div className="space-y-2">
                <h5 className="font-medium text-orange-700">Max Empty</h5>
                <BreakdownInput 
                  name="6kg" 
                  value={returnsBreakdown.max_empty.kg6} 
                  price={returnsBreakdown.max_empty.price6} 
                  onCountChange={v => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg6', v)} 
                  onPriceChange={v => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'price6', v)} 
                />
                <BreakdownInput 
                  name="13kg" 
                  value={returnsBreakdown.max_empty.kg13} 
                  price={returnsBreakdown.max_empty.price13} 
                  onCountChange={v => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg13', v)} 
                  onPriceChange={v => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'price13', v)} 
                />
                <BreakdownInput 
                  name="50kg" 
                  value={returnsBreakdown.max_empty.kg50} 
                  price={returnsBreakdown.max_empty.price50} 
                  onCountChange={v => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg50', v)} 
                  onPriceChange={v => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'price50', v)} 
                />
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-orange-700">Swap Empty</h5>
                <BreakdownInput 
                  name="6kg" 
                  value={returnsBreakdown.swap_empty.kg6} 
                  price={returnsBreakdown.swap_empty.price6} 
                  onCountChange={v => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg6', v)} 
                  onPriceChange={v => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'price6', v)} 
                />
                <BreakdownInput 
                  name="13kg" 
                  value={returnsBreakdown.swap_empty.kg13} 
                  price={returnsBreakdown.swap_empty.price13} 
                  onCountChange={v => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg13', v)} 
                  onPriceChange={v => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'price13', v)} 
                />
                <BreakdownInput 
                  name="50kg" 
                  value={returnsBreakdown.swap_empty.kg50} 
                  price={returnsBreakdown.swap_empty.price50} 
                  onCountChange={v => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg50', v)} 
                  onPriceChange={v => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'price50', v)} 
                />
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-orange-700">Return Full</h5>
                <div className="p-3 rounded-lg bg-white/70 border border-orange-100 space-y-2">
                  <div className="flex items-center gap-3">
                    <Label className="w-20 text-sm font-medium text-orange-700">6kg</Label>
                    <Input 
                      type="number" 
                      value={returnsBreakdown.return_full.kg6 === 0 ? '' : returnsBreakdown.return_full.kg6} 
                      onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg6', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)} 
                      onFocus={(e) => e.target.select()}
                      className="flex-1 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="w-20 text-sm font-medium text-orange-700">13kg</Label>
                    <Input 
                      type="number" 
                      value={returnsBreakdown.return_full.kg13 === 0 ? '' : returnsBreakdown.return_full.kg13} 
                      onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg13', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)} 
                      onFocus={(e) => e.target.select()}
                      className="flex-1 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="w-20 text-sm font-medium text-orange-700">50kg</Label>
                    <Input 
                      type="number" 
                      value={returnsBreakdown.return_full.kg50 === 0 ? '' : returnsBreakdown.return_full.kg50} 
                      onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg50', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)} 
                      onFocus={(e) => e.target.select()}
                      className="flex-1 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
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

      <SectionCard title="Step 4: Returns Breakdown" description="Cylinders brought back by the customer.">
          <div className="space-y-6">
            {/* Max Empty */}
            <div className="bg-white/70 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-3">Max Empty</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-orange-700">6kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.max_empty.kg6 === 0 ? '' : returnsBreakdown.max_empty.kg6}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg6', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-orange-600 text-sm">@ Ksh</span>
                  <Input
                    type="number"
                    value={returnsBreakdown.max_empty.price6}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'price6', parseFloat(e.target.value) || 0)}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-orange-700">13kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.max_empty.kg13 === 0 ? '' : returnsBreakdown.max_empty.kg13}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg13', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-orange-600 text-sm">@ Ksh</span>
                  <Input
                    type="number"
                    value={returnsBreakdown.max_empty.price13}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'price13', parseFloat(e.target.value) || 0)}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-orange-700">50kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.max_empty.kg50 === 0 ? '' : returnsBreakdown.max_empty.kg50}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg50', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-orange-600 text-sm">@ Ksh</span>
                  <Input
                    type="number"
                    value={returnsBreakdown.max_empty.price50}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'price50', parseFloat(e.target.value) || 0)}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
              </div>
            </div>

            {/* Swap Empty */}
            <div className="bg-white/70 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-3">Swap Empty</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-orange-700">6kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.swap_empty.kg6 === 0 ? '' : returnsBreakdown.swap_empty.kg6}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg6', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-orange-600 text-sm">@ Ksh</span>
                  <Input
                    type="number"
                    value={returnsBreakdown.swap_empty.price6}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'price6', parseFloat(e.target.value) || 0)}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-orange-700">13kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.swap_empty.kg13 === 0 ? '' : returnsBreakdown.swap_empty.kg13}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg13', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-orange-600 text-sm">@ Ksh</span>
                  <Input
                    type="number"
                    value={returnsBreakdown.swap_empty.price13}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'price13', parseFloat(e.target.value) || 0)}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-orange-700">50kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.swap_empty.kg50 === 0 ? '' : returnsBreakdown.swap_empty.kg50}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg50', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-orange-600 text-sm">@ Ksh</span>
                  <Input
                    type="number"
                    value={returnsBreakdown.swap_empty.price50}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'price50', parseFloat(e.target.value) || 0)}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
              </div>
            </div>

            {/* Return Full */}
            <div className="bg-white/70 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-3">Return Full</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-orange-700">6kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.return_full.kg6 === 0 ? '' : returnsBreakdown.return_full.kg6}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg6', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-orange-600 text-sm">cylinders</span>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-orange-700">13kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.return_full.kg13 === 0 ? '' : returnsBreakdown.return_full.kg13}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg13', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-orange-600 text-sm">cylinders</span>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-sm font-medium text-orange-700">50kg</Label>
                  <Input
                    type="number"
                    value={returnsBreakdown.return_full.kg50 === 0 ? '' : returnsBreakdown.return_full.kg50}
                    onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg50', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                  <span className="text-orange-600 text-sm">cylinders</span>
                </div>
              </div>
            </div>

            {/* Total Returns Summary with Validation */}
            <div className={`p-4 rounded-lg border-l-4 ${
              calculatedTotalReturns > calculatedTotalLoad 
                ? 'bg-red-50 border-red-500' 
                : 'bg-orange-100 border-orange-500'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-orange-800">Total Returns:</span>
                <span className={`text-2xl font-bold ${
                  calculatedTotalReturns > calculatedTotalLoad 
                    ? 'text-red-600' 
                    : 'text-orange-900'
                }`}>
                  {calculatedTotalReturns} cylinders
                </span>
              </div>
              {calculatedTotalReturns > calculatedTotalLoad && (
                <div className="mt-2 text-red-600 text-sm font-medium">
                  ⚠️ Error: Returns exceed total load by {calculatedTotalReturns - calculatedTotalLoad} cylinders
                </div>
              )}
            </div>
          </div>
        </SectionCard>

      <SectionCard title="Step 4: Payment" description="Settle the financial balance.">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount-paid">Amount Paid</Label>
            <Input id="amount-paid" type="number" value={amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label htmlFor="payment-method">Payment Method</Label>
            <select id="payment-method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-2 border rounded-md">
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              <option value="transfer">Bank Transfer</option>
              <option value="credit">On Credit</option>
            </select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows="3" className="w-full p-2 border rounded-md" />
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end gap-4 pt-8 border-t border-orange-200">
        <Button variant="outline" onClick={onBack} className="border-orange-300 text-orange-700 hover:bg-orange-50 px-6 py-2">
          Cancel
        </Button>
        <Button onClick={validateAndSubmit} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2 shadow-lg">
          <Save className="w-4 h-4 mr-2" />
          Save Transaction
        </Button>
      </div>
    </div>
  )
}
