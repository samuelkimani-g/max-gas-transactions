"use client"

import { useState } from 'react';
import { useStore } from '../lib/store';
import { useRBAC } from '../lib/rbac';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);

export default function TransactionHistory({ transactions = [], customerId }) {
  const { deleteTransaction, submitApprovalRequest, user } = useStore();
  const { permissions } = useRBAC(user);
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleDelete = async (transactionId) => {
    if (confirm('Are you sure you want to request deletion for this transaction?')) {
      try {
        await submitApprovalRequest({
          entity_type: 'transaction',
          entity_id: transactionId,
          request_type: 'delete',
          request_notes: `Operator requests deletion of transaction #${transactionId}.`,
        });
        alert('Deletion request submitted for approval.');
      } catch (error) {
        alert(`Failed to submit deletion request: ${error.message}`);
      }
    }
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
              <TableRow key={t.id} className="cursor-pointer" onClick={() => toggleRow(t.id)}>
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
                <TableCell className="text-center">
                  {permissions.includes('transactions:delete') && (
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
                        <p>Max Empty: {JSON.stringify(t.returns_breakdown?.max_empty)}</p>
                        <p>Swap Empty: {JSON.stringify(t.returns_breakdown?.swap_empty)}</p>
                        <p>Return Full: {JSON.stringify(t.returns_breakdown?.return_full)}</p>
                      </div>
                      <div>
                        <h4 className="font-bold">Outright Breakdown</h4>
                        <p>{JSON.stringify(t.outright_breakdown)}</p>
                      </div>
                       <div>
                        <h4 className="font-bold">Load & Totals</h4>
                        <p>Total Load: {t.total_load}</p>
                        <p>Total Returns: {t.total_returns}</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
