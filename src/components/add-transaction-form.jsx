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
  <Card className="shadow-md border-gray-200 bg-white/80 backdrop-blur-sm">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
)

const BreakdownInput = ({ name, value, price, onCountChange, onPriceChange }) => (
  <div className="flex items-center gap-2">
    <Label htmlFor={`${name}-count`} className="w-24">{name}</Label>
    <Input
      id={`${name}-count`}
      type="number"
      placeholder="0"
      value={value}
      onChange={(e) => onCountChange(parseInt(e.target.value, 10) || 0)}
      className="text-right flex-1"
    />
    <Label htmlFor={`${name}-price`}>@</Label>
    <Input
      id={`${name}-price`}
      type="number"
      placeholder="0.00"
      value={price}
      onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
      className="text-right w-24"
    />
  </div>
)

const LiveSummary = ({ summary }) => (
  <Card className="shadow-lg border-2 border-blue-200 bg-blue-50/50 sticky top-4 z-10">
    <CardHeader>
      <CardTitle className="text-blue-800">Live Transaction Summary</CardTitle>
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
    
    // Calculate from returns/swaps
    Object.values(returnsBreakdown.max_empty).forEach((val, i) => {
      const size = ['kg6', 'kg13', 'kg50'][i];
      if(size) totalBill += returnsBreakdown.max_empty[size] * returnsBreakdown.max_empty[`price${size.substring(2)}`];
    });
     Object.values(returnsBreakdown.swap_empty).forEach((val, i) => {
      const size = ['kg6', 'kg13', 'kg50'][i];
      if(size) totalBill += returnsBreakdown.swap_empty[size] * returnsBreakdown.swap_empty[`price${size.substring(2)}`];
    });
    
    // Calculate from outright purchases
    Object.values(outrightBreakdown).forEach(item => {
      totalBill += item.count * item.price
      totalOutrightCount += item.count
    })

    const financialBalance = totalBill - amountPaid
    const cylinderBalance = totalLoad - (totalReturns + totalOutrightCount)

    return { totalBill, financialBalance, cylinderBalance, amountPaid }
  }, [returnsBreakdown, outrightBreakdown, totalLoad, totalReturns, amountPaid])

  const validateAndSubmit = async () => {
    setError('');
    const returnsSum = 
      Object.values(returnsBreakdown.max_empty).reduce((a, b) => typeof b === 'number' ? a + b : a, 0) +
      Object.values(returnsBreakdown.swap_empty).reduce((a, b) => typeof b === 'number' ? a + b : a, 0) +
      Object.values(returnsBreakdown.return_full).reduce((a, b) => typeof b === 'number' ? a + b : a, 0);

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
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Transaction</h1>
          <p className="text-gray-500">Customer: {customerName}</p>
        </div>
      </div>

      <LiveSummary summary={summary} />
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <div>{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Step 1: Cylinders IN" description="What the customer brought into the compound.">
          <div className="space-y-4">
            <div>
              <Label htmlFor="total-returns">Total Returns (Cylinders)</Label>
              <Input id="total-returns" type="number" value={totalReturns} onChange={e => setTotalReturns(parseInt(e.target.value, 10) || 0)} placeholder="Total cylinders brought in" />
            </div>
            <div className="space-y-2 pl-4 border-l-2">
              <h4 className="font-semibold">Returns Breakdown</h4>
              <BreakdownInput name="Max Empty" value={returnsBreakdown.max_empty.kg6} price={returnsBreakdown.max_empty.price6} onCountChange={v => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg6', 'count', v)} onPriceChange={v => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg6', 'price', v)} />
              <BreakdownInput name="Swap Empty" value={returnsBreakdown.swap_empty.kg6} price={returnsBreakdown.swap_empty.price6} onCountChange={v => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg6', 'count', v)} onPriceChange={v => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg6', 'price', v)} />
              <div>
                <Label>Return Full</Label>
                <Input type="number" value={returnsBreakdown.return_full.kg6} onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg6', 'count', parseInt(e.target.value, 10) || 0)} />
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
      </CardContent>
      </Card>

      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" onClick={onBack}>Cancel</Button>
        <Button onClick={validateAndSubmit}>
          <Save className="w-4 h-4 mr-2" />
          Save Transaction
        </Button>
      </div>
    </div>
  )
}
