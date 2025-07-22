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
import { useToast } from "../hooks/use-toast";

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
          <div className="text-xs text-gray-500 mt-1">6kg: {summary.cylinderBalance6kg || 0}, 13kg: {summary.cylinderBalance13kg || 0}, 50kg: {summary.cylinderBalance50kg || 0}</div>
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

export default function AddTransactionForm({ customerId, customerName, onBack, onSuccess, transaction = null, mode = 'add' }) {
  const { addTransaction, updateTransaction } = useStore();
  const [totalReturns, setTotalReturns] = useState(0);
  const [totalLoad, setTotalLoad] = useState({ kg6: 0, kg13: 0, kg50: 0 });
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Detailed load tracking
  const [loadBreakdown, setLoadBreakdown] = useState({ kg6: 0, kg13: 0, kg50: 0 });
  const [returnsBreakdown, setReturnsBreakdown] = useState({
    max_empty: { kg6: 0, kg13: 0, kg50: 0, price6: 135, price13: 135, price50: 135 },
    swap_empty: { kg6: 0, kg13: 0, kg50: 0, price6: 160, price13: 160, price50: 160 },
    return_full: { kg6: 0, kg13: 0, kg50: 0 },
  });
  const [outrightBreakdown, setOutrightBreakdown] = useState({
    kg6: 0, kg13: 0, kg50: 0, price6: 2200, price13: 4400, price50: 8000,
  });

  // Pre-fill for edit mode
  useEffect(() => {
    if (transaction) {
      setLoadBreakdown({
        kg6: transaction.load_6kg || 0,
        kg13: transaction.load_13kg || 0,
        kg50: transaction.load_50kg || 0,
      });
      setReturnsBreakdown(transaction.returns_breakdown || returnsBreakdown);
      setOutrightBreakdown(transaction.outright_breakdown || outrightBreakdown);
      setTotalLoad({
        kg6: transaction.load_6kg || 0,
        kg13: transaction.load_13kg || 0,
        kg50: transaction.load_50kg || 0,
      });
      setAmountPaid(transaction.amount_paid || 0);
      setPaymentMethod(transaction.payment_method || 'cash');
      setNotes(transaction.notes || '');
    }
  }, [transaction]);
  
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

  // Calculated values
  const calculatedTotalLoad = useMemo(() => {
    return loadBreakdown.kg6 + loadBreakdown.kg13 + loadBreakdown.kg50;
  }, [loadBreakdown]);

  const calculatedTotalReturns = useMemo(() => {
    const maxEmpty = returnsBreakdown.max_empty.kg6 + returnsBreakdown.max_empty.kg13 + returnsBreakdown.max_empty.kg50;
    const swapEmpty = returnsBreakdown.swap_empty.kg6 + returnsBreakdown.swap_empty.kg13 + returnsBreakdown.swap_empty.kg50;
    const returnFull = returnsBreakdown.return_full.kg6 + returnsBreakdown.return_full.kg13 + returnsBreakdown.return_full.kg50;
    return maxEmpty + swapEmpty + returnFull;
  }, [returnsBreakdown]);

  const calculatedTotalBill = useMemo(() => {
    // Refills (Max Empty and Swap Empty): count * price * kg
    const maxEmptyTotal = (returnsBreakdown.max_empty.kg6 * returnsBreakdown.max_empty.price6 * 6) +
                         (returnsBreakdown.max_empty.kg13 * returnsBreakdown.max_empty.price13 * 13) +
                         (returnsBreakdown.max_empty.kg50 * returnsBreakdown.max_empty.price50 * 50);
    const swapEmptyTotal = (returnsBreakdown.swap_empty.kg6 * returnsBreakdown.swap_empty.price6 * 6) +
                          (returnsBreakdown.swap_empty.kg13 * returnsBreakdown.swap_empty.price13 * 13) +
                          (returnsBreakdown.swap_empty.kg50 * returnsBreakdown.swap_empty.price50 * 50);
    // Outright: count * price
    const outrightTotal = (outrightBreakdown.kg6 * outrightBreakdown.price6) +
                         (outrightBreakdown.kg13 * outrightBreakdown.price13) +
                         (outrightBreakdown.kg50 * outrightBreakdown.price50);
    return maxEmptyTotal + swapEmptyTotal + outrightTotal;
  }, [returnsBreakdown, outrightBreakdown]);

  const calculatedFinancialBalance = useMemo(() => {
    return calculatedTotalBill - amountPaid;
  }, [calculatedTotalBill, amountPaid]);

  // Live cylinder balance calculation (per size) - use editable load (Step 3)
  const returns6kg = (returnsBreakdown.max_empty.kg6 || 0) + (returnsBreakdown.swap_empty.kg6 || 0) + (returnsBreakdown.return_full.kg6 || 0);
  const returns13kg = (returnsBreakdown.max_empty.kg13 || 0) + (returnsBreakdown.swap_empty.kg13 || 0) + (returnsBreakdown.return_full.kg13 || 0);
  const returns50kg = (returnsBreakdown.max_empty.kg50 || 0) + (returnsBreakdown.swap_empty.kg50 || 0) + (returnsBreakdown.return_full.kg50 || 0);
  const cylinderBalance6kg = totalLoad.kg6 - returns6kg - (outrightBreakdown.kg6 || 0);
  const cylinderBalance13kg = totalLoad.kg13 - returns13kg - (outrightBreakdown.kg13 || 0);
  const cylinderBalance50kg = totalLoad.kg50 - returns50kg - (outrightBreakdown.kg50 || 0);
  const totalCylinderBalance = cylinderBalance6kg + cylinderBalance13kg + cylinderBalance50kg;

  // Update totalLoad when loadBreakdown changes
  useEffect(() => {
    setTotalLoad(prev => ({ 
      kg6: loadBreakdown.kg6, 
      kg13: loadBreakdown.kg13, 
      kg50: loadBreakdown.kg50 
    }));
  }, [loadBreakdown]);

  const validateAndSubmit = async () => {
    // Validation: Returns must match cylinders brought in by size
    const returns6kg = returnsBreakdown.max_empty.kg6 + returnsBreakdown.swap_empty.kg6 + returnsBreakdown.return_full.kg6;
    const returns13kg = returnsBreakdown.max_empty.kg13 + returnsBreakdown.swap_empty.kg13 + returnsBreakdown.return_full.kg13;
    const returns50kg = returnsBreakdown.max_empty.kg50 + returnsBreakdown.swap_empty.kg50 + returnsBreakdown.return_full.kg50;

    if (loadBreakdown.kg6 !== returns6kg || loadBreakdown.kg13 !== returns13kg || loadBreakdown.kg50 !== returns50kg) {
      toast({ title: 'Validation Error', description: 'Returns breakdown must match cylinders brought in by size', variant: 'destructive' });
      return;
    }

    if (!customerId) {
      toast({ title: 'Validation Error', description: 'Please select a customer', variant: 'destructive' });
      return;
    }

    try {
      const transactionData = {
        customerId: customerId,
        loadBreakdown,
        returnsBreakdown,
        outrightBreakdown,
        totalLoad: totalLoad.kg6 + totalLoad.kg13 + totalLoad.kg50,
        amountPaid,
        paymentMethod,
        notes,
      };
      if (mode === 'edit' && transaction) {
        await updateTransaction(transaction.id, transactionData);
        if (onSuccess) onSuccess('edit');
      } else {
        await addTransaction(transactionData);
        if (onSuccess) onSuccess('add');
      }
      
      // Reset form
      setLoadBreakdown({ kg6: 0, kg13: 0, kg50: 0 });
      setReturnsBreakdown({
        max_empty: { kg6: 0, kg13: 0, kg50: 0, price6: 135, price13: 135, price50: 135 },
        swap_empty: { kg6: 0, kg13: 0, kg50: 0, price6: 160, price13: 160, price50: 160 },
        return_full: { kg6: 0, kg13: 0, kg50: 0 }
      });
      setOutrightBreakdown({ kg6: 0, kg13: 0, kg50: 0, price6: 2200, price13: 4400, price50: 8000 });
      setTotalLoad({ kg6: 0, kg13: 0, kg50: 0 });
      setAmountPaid(0);
      setPaymentMethod('cash');
      setNotes('');
      
      onBack();
    } catch (error) {
      setError(error.message || 'Failed to save transaction.');
    }
  };

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
            {/* Cylinders Brought In - First Input */}
            <div className="bg-orange-50 p-4 rounded border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-3">Cylinders Brought In</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">6kg Cylinders</Label>
                  <Input
                    type="number"
                    value={loadBreakdown.kg6 === 0 ? '' : loadBreakdown.kg6}
                    onChange={e => setLoadBreakdown(prev => ({...prev, kg6: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0}))}
                    onFocus={(e) => e.target.select()}
                    className="mt-1 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">13kg Cylinders</Label>
                  <Input
                    type="number"
                    value={loadBreakdown.kg13 === 0 ? '' : loadBreakdown.kg13}
                    onChange={e => setLoadBreakdown(prev => ({...prev, kg13: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0}))}
                    onFocus={(e) => e.target.select()}
                    className="mt-1 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">50kg Cylinders</Label>
                  <Input
                    type="number"
                    value={loadBreakdown.kg50 === 0 ? '' : loadBreakdown.kg50}
                    onChange={e => setLoadBreakdown(prev => ({...prev, kg50: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0}))}
                    onFocus={(e) => e.target.select()}
                    className="mt-1 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="mt-3 p-2 bg-white rounded border">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total Cylinders Brought In:</span>
                  <span className="text-lg font-bold text-orange-600">{calculatedTotalLoad} cylinders</span>
                </div>
              </div>
            </div>

            {/* Returns Breakdown - Must Match Above */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Returns Breakdown</h4>
              <div className="text-sm text-gray-600 mb-3">
                Break down how the cylinders were returned (must match cylinders brought in by size)
              </div>
              <div className="flex flex-col gap-4">
                {/* Max Empty */}
                <div className="flex-1 bg-white p-6 md:p-10 rounded border border-gray-200 mb-4">
                  <h5 className="font-medium text-orange-700 mb-3 md:mb-6">Max Empty</h5>
                  <div className="grid grid-cols-1 gap-4 md:gap-8 sm:grid-cols-3">
                    <div>
                      <div className="flex items-center gap-2 md:gap-6 md:mb-4">
                        <Input
                          type="number"
                          value={returnsBreakdown.max_empty.kg6 === 0 ? '' : returnsBreakdown.max_empty.kg6}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg6', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-24 md:w-40 text-lg md:text-2xl border-gray-300 focus:border-orange-400 focus:ring-orange-200 px-3 py-2 md:px-6 md:py-4"
                          placeholder="0"
                        />
                        <span className="text-sm md:text-lg text-gray-600">6kg @ Ksh</span>
                        <Input
                          type="number"
                          value={returnsBreakdown.max_empty.price6}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'price6', parseFloat(e.target.value) || 0)}
                          className="w-16 md:w-28 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 md:gap-6 md:mb-4">
                        <Input
                          type="number"
                          value={returnsBreakdown.max_empty.kg13 === 0 ? '' : returnsBreakdown.max_empty.kg13}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg13', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-24 md:w-40 text-lg md:text-2xl border-gray-300 focus:border-orange-400 focus:ring-orange-200 px-3 py-2 md:px-6 md:py-4"
                          placeholder="0"
                        />
                        <span className="text-sm md:text-lg text-gray-600">13kg @ Ksh</span>
                        <Input
                          type="number"
                          value={returnsBreakdown.max_empty.price13}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'price13', parseFloat(e.target.value) || 0)}
                          className="w-16 md:w-28 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 md:gap-6 md:mb-4">
                        <Input
                          type="number"
                          value={returnsBreakdown.max_empty.kg50 === 0 ? '' : returnsBreakdown.max_empty.kg50}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'kg50', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-24 md:w-40 text-lg md:text-2xl border-gray-300 focus:border-orange-400 focus:ring-orange-200 px-3 py-2 md:px-6 md:py-4"
                          placeholder="0"
                        />
                        <span className="text-sm md:text-lg text-gray-600">50kg @ Ksh</span>
                        <Input
                          type="number"
                          value={returnsBreakdown.max_empty.price50}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'max_empty', 'price50', parseFloat(e.target.value) || 0)}
                          className="w-16 md:w-28 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Swap Empty */}
                <div className="flex-1 bg-white p-6 md:p-10 rounded border border-gray-200 mb-4">
                  <h5 className="font-medium text-blue-700 mb-3 md:mb-6">Swap Empty</h5>
                  <div className="grid grid-cols-1 gap-4 md:gap-8 sm:grid-cols-3">
                    <div>
                      <div className="flex items-center gap-2 md:gap-6 md:mb-4">
                        <Input
                          type="number"
                          value={returnsBreakdown.swap_empty.kg6 === 0 ? '' : returnsBreakdown.swap_empty.kg6}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg6', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-24 md:w-40 text-lg md:text-2xl border-gray-300 focus:border-blue-400 focus:ring-blue-200 px-3 py-2 md:px-6 md:py-4"
                          placeholder="0"
                        />
                        <span className="text-sm md:text-lg text-gray-600">6kg @ Ksh</span>
                        <Input
                          type="number"
                          value={returnsBreakdown.swap_empty.price6}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'price6', parseFloat(e.target.value) || 0)}
                          className="w-16 md:w-28 border-gray-300 focus:border-blue-400 focus:ring-blue-200"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 md:gap-6 md:mb-4">
                        <Input
                          type="number"
                          value={returnsBreakdown.swap_empty.kg13 === 0 ? '' : returnsBreakdown.swap_empty.kg13}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg13', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-24 md:w-40 text-lg md:text-2xl border-gray-300 focus:border-blue-400 focus:ring-blue-200 px-3 py-2 md:px-6 md:py-4"
                          placeholder="0"
                        />
                        <span className="text-sm md:text-lg text-gray-600">13kg @ Ksh</span>
                        <Input
                          type="number"
                          value={returnsBreakdown.swap_empty.price13}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'price13', parseFloat(e.target.value) || 0)}
                          className="w-16 md:w-28 border-gray-300 focus:border-blue-400 focus:ring-blue-200"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 md:gap-6 md:mb-4">
                        <Input
                          type="number"
                          value={returnsBreakdown.swap_empty.kg50 === 0 ? '' : returnsBreakdown.swap_empty.kg50}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'kg50', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-24 md:w-40 text-lg md:text-2xl border-gray-300 focus:border-blue-400 focus:ring-blue-200 px-3 py-2 md:px-6 md:py-4"
                          placeholder="0"
                        />
                        <span className="text-sm md:text-lg text-gray-600">50kg @ Ksh</span>
                        <Input
                          type="number"
                          value={returnsBreakdown.swap_empty.price50}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'swap_empty', 'price50', parseFloat(e.target.value) || 0)}
                          className="w-16 md:w-28 border-gray-300 focus:border-blue-400 focus:ring-blue-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Return Full */}
                <div className="flex-1 bg-white p-6 md:p-10 rounded border border-gray-200">
                  <h5 className="font-medium text-green-700 mb-3 md:mb-6">Return Full</h5>
                  <div className="grid grid-cols-1 gap-4 md:gap-8 sm:grid-cols-3">
                    <div>
                      <div className="flex items-center gap-2 md:gap-6 md:mb-4">
                        <Input
                          type="number"
                          value={returnsBreakdown.return_full.kg6 === 0 ? '' : returnsBreakdown.return_full.kg6}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg6', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-24 md:w-40 text-lg md:text-2xl border-gray-300 focus:border-green-400 focus:ring-green-200 px-3 py-2 md:px-6 md:py-4"
                          placeholder="0"
                        />
                        <span className="text-sm md:text-lg text-gray-600">6kg cylinders</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 md:gap-6 md:mb-4">
                        <Input
                          type="number"
                          value={returnsBreakdown.return_full.kg13 === 0 ? '' : returnsBreakdown.return_full.kg13}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg13', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-24 md:w-40 text-lg md:text-2xl border-gray-300 focus:border-green-400 focus:ring-green-200 px-3 py-2 md:px-6 md:py-4"
                          placeholder="0"
                        />
                        <span className="text-sm md:text-lg text-gray-600">13kg cylinders</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 md:gap-6 md:mb-4">
                        <Input
                          type="number"
                          value={returnsBreakdown.return_full.kg50 === 0 ? '' : returnsBreakdown.return_full.kg50}
                          onChange={e => handleBreakdownChange(setReturnsBreakdown, 'return_full', 'kg50', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-24 md:w-40 text-lg md:text-2xl border-gray-300 focus:border-green-400 focus:ring-green-200 px-3 py-2 md:px-6 md:py-4"
                          placeholder="0"
                        />
                        <span className="text-sm md:text-lg text-gray-600">50kg cylinders</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Summary */}
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="font-medium text-gray-700">Size</div>
                <div className="font-medium text-gray-700">Brought In</div>
                <div className="font-medium text-gray-700">Returns Total</div>
                <div className="font-medium text-gray-700">Status</div>
                
                <div>6kg</div>
                <div className="font-semibold">{loadBreakdown.kg6}</div>
                <div className="font-semibold">{(returnsBreakdown.max_empty.kg6 + returnsBreakdown.swap_empty.kg6 + returnsBreakdown.return_full.kg6)}</div>
                <div className={`font-semibold ${
                  loadBreakdown.kg6 === (returnsBreakdown.max_empty.kg6 + returnsBreakdown.swap_empty.kg6 + returnsBreakdown.return_full.kg6)
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {loadBreakdown.kg6 === (returnsBreakdown.max_empty.kg6 + returnsBreakdown.swap_empty.kg6 + returnsBreakdown.return_full.kg6) ? '✓' : '✗'}
                </div>
                
                <div>13kg</div>
                <div className="font-semibold">{loadBreakdown.kg13}</div>
                <div className="font-semibold">{(returnsBreakdown.max_empty.kg13 + returnsBreakdown.swap_empty.kg13 + returnsBreakdown.return_full.kg13)}</div>
                <div className={`font-semibold ${
                  loadBreakdown.kg13 === (returnsBreakdown.max_empty.kg13 + returnsBreakdown.swap_empty.kg13 + returnsBreakdown.return_full.kg13)
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {loadBreakdown.kg13 === (returnsBreakdown.max_empty.kg13 + returnsBreakdown.swap_empty.kg13 + returnsBreakdown.return_full.kg13) ? '✓' : '✗'}
                </div>
                
                <div>50kg</div>
                <div className="font-semibold">{loadBreakdown.kg50}</div>
                <div className="font-semibold">{(returnsBreakdown.max_empty.kg50 + returnsBreakdown.swap_empty.kg50 + returnsBreakdown.return_full.kg50)}</div>
                <div className={`font-semibold ${
                  loadBreakdown.kg50 === (returnsBreakdown.max_empty.kg50 + returnsBreakdown.swap_empty.kg50 + returnsBreakdown.return_full.kg50)
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {loadBreakdown.kg50 === (returnsBreakdown.max_empty.kg50 + returnsBreakdown.swap_empty.kg50 + returnsBreakdown.return_full.kg50) ? '✓' : '✗'}
                </div>
              </div>
              
              {(loadBreakdown.kg6 !== (returnsBreakdown.max_empty.kg6 + returnsBreakdown.swap_empty.kg6 + returnsBreakdown.return_full.kg6) ||
                loadBreakdown.kg13 !== (returnsBreakdown.max_empty.kg13 + returnsBreakdown.swap_empty.kg13 + returnsBreakdown.return_full.kg13) ||
                loadBreakdown.kg50 !== (returnsBreakdown.max_empty.kg50 + returnsBreakdown.swap_empty.kg50 + returnsBreakdown.return_full.kg50)) && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  <strong>⚠️ Validation Error:</strong> Returns breakdown must match cylinders brought in by size
                </div>
              )}
            </div>
          </div>
        </SectionCard>
        
        {/* Outright Section - Mobile Friendly */}
        <SectionCard title="Step 2: Outright" description="Brand-new cylinders purchased separately.">
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            <div className="flex-1 bg-white p-6 rounded border border-gray-200 mb-4">
              <h5 className="font-medium text-orange-700 mb-3">Outright Purchases</h5>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={outrightBreakdown.kg6 === 0 ? '' : outrightBreakdown.kg6}
                      onChange={e => setOutrightBreakdown(prev => ({...prev, kg6: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0}))}
                      onFocus={(e) => e.target.select()}
                      className="w-24 text-lg border-gray-300 focus:border-orange-400 focus:ring-orange-200 px-3 py-2"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-600">6kg @ Ksh</span>
                    <Input
                      type="number"
                      value={outrightBreakdown.price6}
                      onChange={e => setOutrightBreakdown(prev => ({...prev, price6: parseFloat(e.target.value) || 0}))}
                      className="w-16 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={outrightBreakdown.kg13 === 0 ? '' : outrightBreakdown.kg13}
                      onChange={e => setOutrightBreakdown(prev => ({...prev, kg13: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0}))}
                      onFocus={(e) => e.target.select()}
                      className="w-24 text-lg border-gray-300 focus:border-orange-400 focus:ring-orange-200 px-3 py-2"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-600">13kg @ Ksh</span>
                    <Input
                      type="number"
                      value={outrightBreakdown.price13}
                      onChange={e => setOutrightBreakdown(prev => ({...prev, price13: parseFloat(e.target.value) || 0}))}
                      className="w-16 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={outrightBreakdown.kg50 === 0 ? '' : outrightBreakdown.kg50}
                      onChange={e => setOutrightBreakdown(prev => ({...prev, kg50: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0}))}
                      onFocus={(e) => e.target.select()}
                      className="w-24 text-lg border-gray-300 focus:border-orange-400 focus:ring-orange-200 px-3 py-2"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-600">50kg @ Ksh</span>
                    <Input
                      type="number"
                      value={outrightBreakdown.price50}
                      onChange={e => setOutrightBreakdown(prev => ({...prev, price50: parseFloat(e.target.value) || 0}))}
                      className="w-16 border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Step 3: Cylinders OUT" description="What the customer left the compound with.">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3">Cylinder Load Breakdown</h4>
            <div className="text-sm text-blue-600 mb-3">Cylinders given to the customer (editable, auto-suggested)</div>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <Label className="text-sm font-medium text-gray-700 block mb-2">6kg</Label>
                <Input
                  type="number"
                  value={totalLoad.kg6 === 0 ? '' : totalLoad.kg6}
                  onChange={e => setTotalLoad(prev => ({...prev, kg6: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0}))}
                  onFocus={(e) => e.target.select()}
                  className="text-center border-gray-300 focus:border-blue-400 focus:ring-blue-200 text-lg font-semibold"
                  placeholder={(returnsBreakdown.max_empty.kg6 + returnsBreakdown.swap_empty.kg6 + returnsBreakdown.return_full.kg6) + outrightBreakdown.kg6}
                />
                <div className="text-sm text-gray-600 mt-1">cylinders</div>
                <div className="text-xs text-gray-500 mt-1">
                  Suggested: {(returnsBreakdown.max_empty.kg6 + returnsBreakdown.swap_empty.kg6 + returnsBreakdown.return_full.kg6)} returns + {outrightBreakdown.kg6} outright
                </div>
              </div>
              
              <div className="text-center">
                <Label className="text-sm font-medium text-gray-700 block mb-2">13kg</Label>
                <Input
                  type="number"
                  value={totalLoad.kg13 === 0 ? '' : totalLoad.kg13}
                  onChange={e => setTotalLoad(prev => ({...prev, kg13: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0}))}
                  onFocus={(e) => e.target.select()}
                  className="text-center border-gray-300 focus:border-blue-400 focus:ring-blue-200 text-lg font-semibold"
                  placeholder={(returnsBreakdown.max_empty.kg13 + returnsBreakdown.swap_empty.kg13 + returnsBreakdown.return_full.kg13) + outrightBreakdown.kg13}
                />
                <div className="text-sm text-gray-600 mt-1">cylinders</div>
                <div className="text-xs text-gray-500 mt-1">
                  Suggested: {(returnsBreakdown.max_empty.kg13 + returnsBreakdown.swap_empty.kg13 + returnsBreakdown.return_full.kg13)} returns + {outrightBreakdown.kg13} outright
                </div>
              </div>
              
              <div className="text-center">
                <Label className="text-sm font-medium text-gray-700 block mb-2">50kg</Label>
                <Input
                  type="number"
                  value={totalLoad.kg50 === 0 ? '' : totalLoad.kg50}
                  onChange={e => setTotalLoad(prev => ({...prev, kg50: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0}))}
                  onFocus={(e) => e.target.select()}
                  className="text-center border-gray-300 focus:border-blue-400 focus:ring-blue-200 text-lg font-semibold"
                  placeholder={(returnsBreakdown.max_empty.kg50 + returnsBreakdown.swap_empty.kg50 + returnsBreakdown.return_full.kg50) + outrightBreakdown.kg50}
                />
                <div className="text-sm text-gray-600 mt-1">cylinders</div>
                <div className="text-xs text-gray-500 mt-1">
                  Suggested: {(returnsBreakdown.max_empty.kg50 + returnsBreakdown.swap_empty.kg50 + returnsBreakdown.return_full.kg50)} returns + {outrightBreakdown.kg50} outright
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Total Load:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {totalLoad.kg6 + totalLoad.kg13 + totalLoad.kg50} cylinders
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Manual Total: {totalLoad.kg6 + totalLoad.kg13 + totalLoad.kg50} | Suggested: {calculatedTotalReturns + outrightBreakdown.kg6 + outrightBreakdown.kg13 + outrightBreakdown.kg50}
                {(totalLoad.kg6 + totalLoad.kg13 + totalLoad.kg50) !== (calculatedTotalReturns + outrightBreakdown.kg6 + outrightBreakdown.kg13 + outrightBreakdown.kg50) && (
                  <span className="ml-2 text-orange-600 font-medium">⚠️ Manual override</span>
                )}
              </div>
            </div>
            
            {/* Auto-fill button for convenience */}
            <div className="mt-3 text-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const suggested6kg = (returnsBreakdown.max_empty.kg6 + returnsBreakdown.swap_empty.kg6 + returnsBreakdown.return_full.kg6) + outrightBreakdown.kg6;
                  const suggested13kg = (returnsBreakdown.max_empty.kg13 + returnsBreakdown.swap_empty.kg13 + returnsBreakdown.return_full.kg13) + outrightBreakdown.kg13;
                  const suggested50kg = (returnsBreakdown.max_empty.kg50 + returnsBreakdown.swap_empty.kg50 + returnsBreakdown.return_full.kg50) + outrightBreakdown.kg50;
                  setTotalLoad({ kg6: suggested6kg, kg13: suggested13kg, kg50: suggested50kg });
                }}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                Auto-Fill Suggested Values
              </Button>
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
            <div className="flex gap-2 mt-2">
              <Button type="button" size="sm" variant="outline" className="w-1/2" onClick={() => setAmountPaid(calculatedTotalBill)}>
                Full
              </Button>
              <Button type="button" size="sm" variant="outline" className="w-1/2" onClick={() => setAmountPaid(calculatedTotalBill / 2)}>
                Half
              </Button>
            </div>
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

      <LiveSummary
        summary={{
          financialBalance: calculatedFinancialBalance,
          totalBill: calculatedTotalBill,
          cylinderBalance: totalCylinderBalance,
          amountPaid: amountPaid,
          cylinderBalance6kg,
          cylinderBalance13kg,
          cylinderBalance50kg,
        }}
      />

      <div className="flex justify-between">
        <Button 
          onClick={onBack} 
          variant="outline" 
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button 
          onClick={validateAndSubmit} 
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Transaction
        </Button>
      </div>
    </div>
  )
}
