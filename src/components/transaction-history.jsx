"use client"

import { useState } from 'react';
import { useStore } from '../lib/store';
import { useRBAC } from '../lib/rbac';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronRight, Edit, Trash2, Package, RefreshCw, ShoppingCart, DollarSign, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../hooks/use-toast';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import ReceiptGenerator from './receipt-generator';
import ReportingInsights from './reporting-insights';
import EditTransactionForm from './edit-transaction-form';
import AddTransactionForm from './add-transaction-form';

const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);

export default function TransactionHistory({ transactions = [], customerId, onEdit }) {
  const { deleteTransaction, submitApprovalRequest, user } = useStore();
  const rbac = useRBAC(user);
  const [expandedRow, setExpandedRow] = useState(null);
  const { toast } = useToast();
  const [modalTransaction, setModalTransaction] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleDelete = async (transactionId) => {
    if (rbac?.permissions?.canRequestApproval && !rbac?.permissions?.canDeleteTransaction) {
      toast({
        title: 'Confirm Deletion',
        description: 'Are you sure you want to request deletion for this transaction?',
        action: {
          label: 'Delete',
          onClick: async () => {
            try {
              await submitApprovalRequest({
                entity_type: 'transaction',
                entity_id: transactionId,
                request_type: 'delete',
                request_notes: `Operator requests deletion of transaction #${transactionId}.`,
              });
              toast({ title: 'Deletion Requested', description: 'Deletion request submitted for approval.', variant: 'success' });
            } catch (error) {
              toast({ title: 'Error', description: `Failed to submit deletion request: ${error.message}`, variant: 'destructive' });
            }
          },
        },
        variant: 'warning',
        duration: 8000,
      });
    } else {
      // Direct delete for managers/admins
      try {
        await deleteTransaction(transactionId);
        toast({ title: 'Transaction Deleted', description: 'Transaction deleted successfully.', variant: 'success' });
      } catch (error) {
        toast({ title: 'Error', description: `Failed to delete transaction: ${error.message}`, variant: 'destructive' });
      }
    }
  };

  const handleEdit = (transaction) => {
    if (onEdit) onEdit(transaction);
    else toast({ title: 'Edit', description: 'Edit functionality coming soon!', variant: 'info' });
  };

  if (!transactions || transactions.length === 0) {
    return <p className="text-center text-gray-500 py-4">No transactions found for this customer.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Total Bill</TableHead>
            <TableHead className="text-right">Amount Paid</TableHead>
            <TableHead className="text-right">Financial Balance</TableHead>
            <TableHead className="text-right">Cylinder Balance</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <>
              <TableRow key={t.id} className="cursor-pointer" onClick={() => setModalTransaction(t)}>
                <TableCell>
                  {expandedRow === t.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </TableCell>
                <TableCell>{format(new Date(t.date), 'PP')}</TableCell>
                <TableCell className="text-right">{formatNumber(t.total_bill)}</TableCell>
                <TableCell className="text-right text-green-600">{formatNumber(t.amount_paid)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={t.financial_balance > 0 ? 'destructive' : 'default'}>
                    {formatNumber(t.financial_balance)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={t.cylinder_balance > 0 ? 'destructive' : 'default'}>
                    {t.cylinder_balance > 0 ? `+${t.cylinder_balance}`: t.cylinder_balance}
                  </Badge>
                </TableCell>
                <TableCell className="text-center flex gap-2 justify-center">
                  <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); handleEdit(t);}}>
                    <Edit className="h-4 w-4 text-blue-500" />
                  </Button>
                  {rbac?.permissions?.canDeleteTransaction && (
                     <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); handleDelete(t.id);}}>
                       <Trash2 className="h-4 w-4 text-red-500" />
                     </Button>
                  )}
                </TableCell>
              </TableRow>
              {expandedRow === t.id && (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <div className="bg-gray-50 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-bold">Returns Breakdown</h4>
                        <p>Max Empty: {t.returns_breakdown?.max_empty ? `${t.returns_breakdown.max_empty.kg6 || 0} x 6kg, ${t.returns_breakdown.max_empty.kg13 || 0} x 13kg, ${t.returns_breakdown.max_empty.kg50 || 0} x 50kg` : '-'}</p>
                        <p>Swap Empty: {t.returns_breakdown?.swap_empty ? `${t.returns_breakdown.swap_empty.kg6 || 0} x 6kg, ${t.returns_breakdown.swap_empty.kg13 || 0} x 13kg, ${t.returns_breakdown.swap_empty.kg50 || 0} x 50kg` : '-'}</p>
                        <p>Return Full: {t.returns_breakdown?.return_full ? `${t.returns_breakdown.return_full.kg6 || 0} x 6kg, ${t.returns_breakdown.return_full.kg13 || 0} x 13kg, ${t.returns_breakdown.return_full.kg50 || 0} x 50kg` : '-'}</p>
                      </div>
                      <div>
                        <h4 className="font-bold">Outright Breakdown</h4>
                        <p>{t.outright_breakdown ? `${t.outright_breakdown.kg6 || 0} x 6kg @ Ksh ${t.outright_breakdown.price6 || 0}, ${t.outright_breakdown.kg13 || 0} x 13kg @ Ksh ${t.outright_breakdown.price13 || 0}, ${t.outright_breakdown.kg50 || 0} x 50kg @ Ksh ${t.outright_breakdown.price50 || 0}` : '-'}</p>
                      </div>
                      <div>
                        <h4 className="font-bold">Load & Totals</h4>
                        <p>Load: {t.load_6kg || 0} x 6kg, {t.load_13kg || 0} x 13kg, {t.load_50kg || 0} x 50kg</p>
                        <p>Total Load: {t.total_load || 0}</p>
                        <p>Total Returns: {t.total_returns || 0}</p>
                        <p>Bill: Ksh {formatNumber(t.total_bill)}</p>
                        <p>Paid: Ksh {formatNumber(t.amount_paid)}</p>
                        <p>Balance: Ksh {formatNumber(t.financial_balance)}</p>
                        <p>Cylinder Balance: {t.cylinder_balance}</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>

      {editingTransaction && (
        <Dialog open={!!editingTransaction} onOpenChange={open => { if (!open) setEditingTransaction(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
            <AddTransactionForm
              transaction={editingTransaction}
              mode="edit"
              onBack={() => setEditingTransaction(null)}
              onSuccess={() => setEditingTransaction(null)}
            />
          </DialogContent>
        </Dialog>
      )}
      {/* Transaction Details Modal */}
      <Dialog open={!!modalTransaction} onOpenChange={open => { if (!open) setModalTransaction(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-white rounded-xl shadow-2xl">
          <div className="flex justify-between items-center px-8 pt-8 pb-4 border-b">
            <div>
              <DialogTitle className="text-2xl font-extrabold text-orange-600 flex items-center gap-2">
                <Package className="w-7 h-7 text-orange-400" />
                Transaction Details #{modalTransaction?.transaction_number}
              </DialogTitle>
              <DialogDescription className="text-gray-500 mt-1">
                Date: {modalTransaction ? format(new Date(modalTransaction.date), 'PPpp') : ''}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-700">
                ×
              </Button>
            </DialogClose>
          </div>
          {modalTransaction && (() => {
            const cylinderBalance6kg = (modalTransaction.load_6kg || 0) - ((modalTransaction.returns_breakdown?.max_empty?.kg6 || 0) + (modalTransaction.returns_breakdown?.swap_empty?.kg6 || 0) + (modalTransaction.returns_breakdown?.return_full?.kg6 || 0) + (modalTransaction.outright_breakdown?.kg6 || 0));
            const cylinderBalance13kg = (modalTransaction.load_13kg || 0) - ((modalTransaction.returns_breakdown?.max_empty?.kg13 || 0) + (modalTransaction.returns_breakdown?.swap_empty?.kg13 || 0) + (modalTransaction.returns_breakdown?.return_full?.kg13 || 0) + (modalTransaction.outright_breakdown?.kg13 || 0));
            const cylinderBalance50kg = (modalTransaction.load_50kg || 0) - ((modalTransaction.returns_breakdown?.max_empty?.kg50 || 0) + (modalTransaction.returns_breakdown?.swap_empty?.kg50 || 0) + (modalTransaction.returns_breakdown?.return_full?.kg50 || 0) + (modalTransaction.outright_breakdown?.kg50 || 0));
            const cylinderBalance = cylinderBalance6kg + cylinderBalance13kg + cylinderBalance50kg;
            const returns6kg = (modalTransaction.returns_breakdown?.max_empty?.kg6 || 0) + (modalTransaction.returns_breakdown?.swap_empty?.kg6 || 0) + (modalTransaction.returns_breakdown?.return_full?.kg6 || 0);
            const returns13kg = (modalTransaction.returns_breakdown?.max_empty?.kg13 || 0) + (modalTransaction.returns_breakdown?.swap_empty?.kg13 || 0) + (modalTransaction.returns_breakdown?.return_full?.kg13 || 0);
            const returns50kg = (modalTransaction.returns_breakdown?.max_empty?.kg50 || 0) + (modalTransaction.returns_breakdown?.swap_empty?.kg50 || 0) + (modalTransaction.returns_breakdown?.return_full?.kg50 || 0);
            const totalReturns = returns6kg + returns13kg + returns50kg;
            const outright6kg = modalTransaction.outright_breakdown?.kg6 || 0;
            const outright13kg = modalTransaction.outright_breakdown?.kg13 || 0;
            const outright50kg = modalTransaction.outright_breakdown?.kg50 || 0;
            const outrightTotal = (outright6kg * (modalTransaction.outright_breakdown?.price6 || 0)) + (outright13kg * (modalTransaction.outright_breakdown?.price13 || 0)) + (outright50kg * (modalTransaction.outright_breakdown?.price50 || 0));
            const totalOutright = outright6kg + outright13kg + outright50kg;
            return (
              <div className="p-6 space-y-6">
                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap mb-6">
                  <Button size="sm" variant="outline" onClick={() => window.open(`/transaction/${modalTransaction.id}`, '_blank')}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Open in New Tab
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowReceipt(true); }}>
                    <ReceiptGenerator className="w-4 h-4 mr-1" /> View Receipt
                  </Button>
                  {onEdit && <Button size="sm" variant="outline" onClick={() => { setModalTransaction(null); setEditingTransaction(modalTransaction); }}>
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>}
                </div>

                {/* Transaction Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Step 1: Cylinders IN */}
                  <div className="bg-orange-50 rounded-xl p-6 border border-orange-200 shadow-sm">
                    <h4 className="font-bold mb-4 text-orange-700 flex items-center gap-2 text-lg">
                      <RefreshCw className="w-5 h-5" /> 
                      Step 1: Cylinders IN
                    </h4>
                    <p className="text-sm text-orange-600 mb-4">What the customer brought into the compound</p>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-orange-100">
                        <h5 className="font-semibold text-orange-700 mb-3">Returns Breakdown</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-600">6kg</label>
                            <div className="text-lg font-bold text-gray-900">{modalTransaction.returns_breakdown?.max_empty?.kg6 || 0}</div>
                            <div className="text-xs text-gray-500">Max Empty</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">13kg</label>
                            <div className="text-lg font-bold text-gray-900">{modalTransaction.returns_breakdown?.max_empty?.kg13 || 0}</div>
                            <div className="text-xs text-gray-500">Max Empty</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">50kg</label>
                            <div className="text-lg font-bold text-gray-900">{modalTransaction.returns_breakdown?.max_empty?.kg50 || 0}</div>
                            <div className="text-xs text-gray-500">Max Empty</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-orange-100">
                        <h5 className="font-semibold text-orange-700 mb-3">Swap Empty</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-600">6kg</label>
                            <div className="text-lg font-bold text-gray-900">{modalTransaction.returns_breakdown?.swap_empty?.kg6 || 0}</div>
                            <div className="text-xs text-gray-500">@ Ksh {modalTransaction.returns_breakdown?.swap_empty?.price6 || 160}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">13kg</label>
                            <div className="text-lg font-bold text-gray-900">{modalTransaction.returns_breakdown?.swap_empty?.kg13 || 0}</div>
                            <div className="text-xs text-gray-500">@ Ksh {modalTransaction.returns_breakdown?.swap_empty?.price13 || 160}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">50kg</label>
                            <div className="text-lg font-bold text-gray-900">{modalTransaction.returns_breakdown?.swap_empty?.kg50 || 0}</div>
                            <div className="text-xs text-gray-500">@ Ksh {modalTransaction.returns_breakdown?.swap_empty?.price50 || 160}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-orange-100">
                        <h5 className="font-semibold text-orange-700 mb-3">Return Full</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-600">6kg</label>
                            <div className="text-lg font-bold text-gray-900">{modalTransaction.returns_breakdown?.return_full?.kg6 || 0}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">13kg</label>
                            <div className="text-lg font-bold text-gray-900">{modalTransaction.returns_breakdown?.return_full?.kg13 || 0}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">50kg</label>
                            <div className="text-lg font-bold text-gray-900">{modalTransaction.returns_breakdown?.return_full?.kg50 || 0}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Outright */}
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 shadow-sm">
                    <h4 className="font-bold mb-4 text-blue-700 flex items-center gap-2 text-lg">
                      <ShoppingCart className="w-5 h-5" /> 
                      Step 2: Outright
                    </h4>
                    <p className="text-sm text-blue-600 mb-4">Brand-new cylinders purchased separately</p>
                    
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h5 className="font-semibold text-blue-700 mb-3">Outright Purchases</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-600">6kg</label>
                          <div className="text-lg font-bold text-gray-900">{modalTransaction.outright_breakdown?.kg6 || 0}</div>
                          <div className="text-xs text-gray-500">@ Ksh {modalTransaction.outright_breakdown?.price6 || 2200}</div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">13kg</label>
                          <div className="text-lg font-bold text-gray-900">{modalTransaction.outright_breakdown?.kg13 || 0}</div>
                          <div className="text-xs text-gray-500">@ Ksh {modalTransaction.outright_breakdown?.price13 || 4400}</div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">50kg</label>
                          <div className="text-lg font-bold text-gray-900">{modalTransaction.outright_breakdown?.kg50 || 0}</div>
                          <div className="text-xs text-gray-500">@ Ksh {modalTransaction.outright_breakdown?.price50 || 8000}</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-100">
                        <div className="font-bold text-blue-700">Outright Total: Ksh {formatNumber(outrightTotal)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Cylinders OUT */}
                  <div className="bg-green-50 rounded-xl p-6 border border-green-200 shadow-sm">
                    <h4 className="font-bold mb-4 text-green-700 flex items-center gap-2 text-lg">
                      <Package className="w-5 h-5" /> 
                      Step 3: Cylinders OUT
                    </h4>
                    <p className="text-sm text-green-600 mb-4">What the customer left the compound with</p>
                    
                    <div className="bg-white rounded-lg p-4 border border-green-100">
                      <h5 className="font-semibold text-green-700 mb-3">Cylinder Load Breakdown</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-600">6kg</label>
                          <div className="text-lg font-bold text-gray-900">{modalTransaction.load_6kg || 0}</div>
                          <div className="text-xs text-gray-500">cylinders</div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">13kg</label>
                          <div className="text-lg font-bold text-gray-900">{modalTransaction.load_13kg || 0}</div>
                          <div className="text-xs text-gray-500">cylinders</div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">50kg</label>
                          <div className="text-lg font-bold text-gray-900">{modalTransaction.load_50kg || 0}</div>
                          <div className="text-xs text-gray-500">cylinders</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-green-100">
                        <div className="font-bold text-green-700">Total Load: {modalTransaction.total_load || 0} cylinders</div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Payment & Summary */}
                  <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 shadow-sm">
                    <h4 className="font-bold mb-4 text-purple-700 flex items-center gap-2 text-lg">
                      <DollarSign className="w-5 h-5" /> 
                      Step 4: Payment & Summary
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <h5 className="font-semibold text-purple-700 mb-3">Financial Summary</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Bill:</span>
                            <span className="font-bold text-orange-700">Ksh {formatNumber(modalTransaction.total_bill)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Amount Paid:</span>
                            <span className="font-bold text-green-700">Ksh {formatNumber(modalTransaction.amount_paid)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-200">
                            <span className="text-sm font-semibold text-gray-700">Balance:</span>
                            <span className="font-bold text-red-700">Ksh {formatNumber(modalTransaction.financial_balance)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <h5 className="font-semibold text-purple-700 mb-3">Cylinder Balance</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">{cylinderBalance6kg}</div>
                            <div className="text-sm text-gray-600">6kg Cylinders</div>
                            <div className="text-xs text-gray-500">{cylinderBalance6kg > 0 ? 'Owed to us' : cylinderBalance6kg < 0 ? 'Owed to customer' : 'Settled'}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">{cylinderBalance13kg}</div>
                            <div className="text-sm text-gray-600">13kg Cylinders</div>
                            <div className="text-xs text-gray-500">{cylinderBalance13kg > 0 ? 'Owed to us' : cylinderBalance13kg < 0 ? 'Owed to customer' : 'Settled'}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">{cylinderBalance50kg}</div>
                            <div className="text-sm text-gray-600">50kg Cylinders</div>
                            <div className="text-xs text-gray-500">{cylinderBalance50kg > 0 ? 'Owed to us' : cylinderBalance50kg < 0 ? 'Owed to customer' : 'Settled'}</div>
                          </div>
                        </div>
                        <div className="text-center mt-3 pt-3 border-t border-gray-200">
                          <div className="font-bold text-purple-700">Total Cylinder Balance: {cylinderBalance} ({cylinderBalance > 0 ? 'Owed to us' : cylinderBalance < 0 ? 'Owed to customer' : 'Settled'})</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={open => setShowReceipt(open)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <div className="flex justify-between items-center px-6 pt-6 pb-2 border-b">
            <DialogTitle className="text-xl font-bold">Transaction Receipt</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-700">
                ×
              </Button>
            </DialogClose>
          </div>
          <div className="p-6">
            {modalTransaction && <ReceiptGenerator transaction={modalTransaction} customer={modalTransaction.Customer} />}
          </div>
        </DialogContent>
      </Dialog>
      {/* Report Modal */}
      <Dialog open={showReport} onOpenChange={open => setShowReport(open)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Report</DialogTitle>
          </DialogHeader>
          {modalTransaction && <ReportingInsights transactions={[modalTransaction]} customers={[modalTransaction.Customer]} />}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
