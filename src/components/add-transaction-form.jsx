"use client"

import { useState, useMemo } from "react"
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

const BreakdownInput = ({ name, value, price, onCountChange, onPriceChange }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/70 border border-orange-100 hover:bg-white/90 transition-colors">
    <Label htmlFor={`${name}-count`} className="w-20 text-sm font-medium text-orange-700">{name}</Label>
    <Input
      id={`${name}-count`}
      type="number"
      placeholder="0"
      value={value || ''}
      onChange={(e) => onCountChange(parseInt(e.target.value, 10) || 0)}
      className="text-right flex-1 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
    />
    <Label htmlFor={`${name}-price`} className="text-orange-600 font-medium">@</Label>
    <Input
      id={`${name}-price`}
      type="number"
      placeholder="0.00"
      value={price || ''}
      onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
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
    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div className="bg-white p-3 rounded-lg shadow">
        <div className="text-sm text-gray-500">Cylinder Balance</div>
        <div className={`text-2xl font-bold ${summary.cylinderBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {summary.cylinderBalance > 0 ? `+${summary.cylinderBalance}` : summary.cylinderBalance}
        </div>
        <div className="text-xs text-gray-500">{summary.cylinderBalance > 0 ? 'Owed by Customer' : 'Owed to Customer'}</div>
      </div>
      <div className="bg-white p-3 rounded-lg shadow">
        <div className="text-sm text-gray-500">Financial Balance</div>
        <div className={`text-2xl font-bold ${summary.financialBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {summary.financialBalance.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">{summary.financialBalance > 0 ? 'Owed by Customer' : 'Credit'}</div>
      </div>
      <div className="bg-white p-3 rounded-lg shadow">
        <div className="text-sm text-gray-500">Total Bill</div>
        <div className="text-2xl font-bold text-gray-800">{summary.totalBill.toFixed(2)}</div>
      </div>
      <div className="bg-white p-3 rounded-lg shadow">
        <div className="text-sm text-gray-500">Amount Paid</div>
        <div className="text-2xl font-bold text-gray-800">{summary.amountPaid.toFixed(2)}</div>
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
  
  const handleBreakdownChange = (setBreakdown, category, size, key, value) => {
    setBreakdown(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [size]: { ...prev[category][size], [key]: value }
      }
    }))
  }

  const summary = useMemo(() => {
    let totalBill = 0
    let totalOutrightCount = 0
    
    // Calculate from returns - Max Empty
    totalBill += (returnsBreakdown.max_empty.kg6 * returnsBreakdown.max_empty.price6) +
                 (returnsBreakdown.max_empty.kg13 * returnsBreakdown.max_empty.price13) +
                 (returnsBreakdown.max_empty.kg50 * returnsBreakdown.max_empty.price50)
    
    // Calculate from returns - Swap Empty  
    totalBill += (returnsBreakdown.swap_empty.kg6 * returnsBreakdown.swap_empty.price6) +
                 (returnsBreakdown.swap_empty.kg13 * returnsBreakdown.swap_empty.price13) +
                 (returnsBreakdown.swap_empty.kg50 * returnsBreakdown.swap_empty.price50)
    
    // Return Full cylinders don't generate revenue (customer returning our cylinders)
    // No calculation needed for return_full
    
    // Calculate from outright purchases
    totalBill += (outrightBreakdown.kg6.count * outrightBreakdown.kg6.price) +
                 (outrightBreakdown.kg13.count * outrightBreakdown.kg13.price) +
                 (outrightBreakdown.kg50.count * outrightBreakdown.kg50.price)
    
    totalOutrightCount = outrightBreakdown.kg6.count + outrightBreakdown.kg13.count + outrightBreakdown.kg50.count

    const financialBalance = totalBill - amountPaid
    const cylinderBalance = totalLoad - (totalReturns + totalOutrightCount)

    return { totalBill, financialBalance, cylinderBalance, amountPaid }
  }, [returnsBreakdown, outrightBreakdown, totalLoad, totalReturns, amountPaid])

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
              <BreakdownInput 
                name="Max Empty" 
                value={returnsBreakdown.max_empty.kg6} 
                price={returnsBreakdown.max_empty.price6} 
                onCountChange={v => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg6', v)} 
                onPriceChange={v => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'price6', v)} 
              />
              <BreakdownInput 
                name="Swap Empty" 
                value={returnsBreakdown.swap_empty.kg6} 
                price={returnsBreakdown.swap_empty.price6} 
                onCountChange={v => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg6', v)} 
                onPriceChange={v => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'price6', v)} 
              />
              <div className="p-3 rounded-lg bg-white/70 border border-orange-100">
                <Label className="text-orange-700 font-medium">Return Full</Label>
                <Input 
                  type="number" 
                  value={returnsBreakdown.return_full.kg6 || ''} 
                  onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg6', parseInt(e.target.value, 10) || 0)} 
                  className="mt-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  placeholder="0"
                />
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
        <div>
          <Label htmlFor="total-load">Total Load (Cylinders)</Label>
          <Input id="total-load" type="number" value={totalLoad} onChange={e => setTotalLoad(parseInt(e.target.value, 10) || 0)} placeholder="Total cylinders leaving" />
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
