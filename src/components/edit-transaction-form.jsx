"use client"

import AddTransactionForm from "./add-transaction-form"

export default function EditTransactionForm({ transaction, onBack, onSuccess }) {
  // Use the AddTransactionForm in edit mode
  return (
    <AddTransactionForm
      customerId={transaction?.customerId}
      customerName={transaction?.customer?.name || transaction?.Customer?.name || "Customer"}
      transaction={transaction}
      mode="edit"
      onBack={onBack}
      onSuccess={onSuccess}
    />
  )
}
