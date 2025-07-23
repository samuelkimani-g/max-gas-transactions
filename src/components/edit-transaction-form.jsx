"use client"

import AddTransactionForm from "./add-transaction-form"

export default function EditTransactionForm({ transaction, onBack, onSuccess }) {
  // Use the AddTransactionForm in edit mode
  return (
    <AddTransactionForm
      transaction={transaction}
      mode="edit"
      onBack={onBack}
      onSuccess={onSuccess}
    />
  )
}
