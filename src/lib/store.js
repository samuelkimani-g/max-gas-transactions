import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useStore = create(
  persist(
    (set, get) => ({
      customers: [],
      transactions: [],
      selectedCustomerId: null,
      searchQuery: "",
      isAddingTransaction: false,
      isLoading: false,

      // Customer Actions
      addCustomer: (customer) =>
        set((state) => {
          const newId = state.customers.length > 0 ? Math.max(...state.customers.map((c) => c.id)) + 1 : 1
          return {
            customers: [...state.customers, { ...customer, id: newId }],
          }
        }),

      updateCustomer: (id, customer) =>
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...customer } : c)),
        })),

      deleteCustomer: (id) =>
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
          transactions: state.transactions.filter((t) => t.customerId !== id),
          selectedCustomerId: state.selectedCustomerId === id ? null : state.selectedCustomerId,
        })),

      // Transaction Actions
      addTransaction: (transaction) =>
        set((state) => {
          const newId =
            state.transactions.length > 0
              ? String(Math.max(...state.transactions.map((t) => Number.parseInt(t.id))) + 1)
              : "1"

          const newTransaction = {
            ...transaction,
            id: newId,
            date: transaction.date || new Date().toISOString(),
            customerId: Number(transaction.customerId),
          }

          return {
            transactions: [...state.transactions, newTransaction],
          }
        }),

      updateTransaction: (id, transaction) =>
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...transaction } : t)),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      bulkDeleteTransactions: (ids) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => !ids.includes(t.id)),
        })),

      bulkUpdateTransactionPayments: (ids, amount) =>
        set((state) => ({
          transactions: state.transactions.map((t) => (ids.includes(t.id) ? { ...t, paid: amount } : t)),
        })),

      // Bulk payment for customer - pay all outstanding transactions
      recordBulkPayment: (customerId, amount, note = "") =>
        set((state) => {
          const customerTransactions = state.transactions
            .filter((t) => t.customerId === customerId)
            .sort((a, b) => new Date(a.date) - new Date(b.date)) // Oldest first

          let remainingAmount = amount
          const updatedTransactions = state.transactions.map((transaction) => {
            if (transaction.customerId !== customerId || remainingAmount <= 0) {
              return transaction
            }

            const total = calculateTransactionTotal(transaction)
            const currentPaid = transaction.paid || 0
            const outstanding = total - currentPaid

            if (outstanding <= 0) {
              return transaction
            }

            const paymentForThis = Math.min(outstanding, remainingAmount)
            remainingAmount -= paymentForThis

            return {
              ...transaction,
              paid: currentPaid + paymentForThis,
              notes: transaction.notes ? `${transaction.notes}\n${note}` : note,
            }
          })

          return {
            transactions: updatedTransactions,
          }
        }),

      // UI State Actions
      setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setIsAddingTransaction: (isAdding) => set({ isAddingTransaction: isAdding }),

      // Helper Functions
      getCustomerTransactions: (customerId) => {
        const state = get()
        return state.transactions.filter((t) => t.customerId === customerId)
      },

      getCustomerOutstanding: (customerId) => {
        const state = get()
        const transactions = state.transactions.filter((t) => t.customerId === customerId)
        return transactions.reduce((total, t) => {
          const transactionTotal = calculateTransactionTotal(t)
          return total + (transactionTotal - (t.paid || 0))
        }, 0)
      },

      getFilteredCustomers: () => {
        const state = get()
        if (!state.searchQuery) return state.customers

        return state.customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            customer.phone.includes(state.searchQuery) ||
            (customer.email && customer.email.toLowerCase().includes(state.searchQuery.toLowerCase())),
        )
      },
    }),
    {
      name: "gas-cylinder-store",
      version: 1,
    },
  ),
)

// Helper function to calculate transaction total
function calculateTransactionTotal(transaction) {
  if (!transaction) return 0

  // MaxGas Refills (Returns)
  const refill6kg = (transaction.return6kg || 0) * (transaction.refillPrice6kg || 135)
  const refill13kg = (transaction.return13kg || 0) * (transaction.refillPrice13kg || 135)
  const refill50kg = (transaction.return50kg || 0) * (transaction.refillPrice50kg || 135)

  // MaxGas Outright Sales (Full cylinders)
  const outright6kg = (transaction.outright6kg || 0) * (transaction.outrightPrice6kg || 3200)
  const outright13kg = (transaction.outright13kg || 0) * (transaction.outrightPrice13kg || 3500)
  const outright50kg = (transaction.outright50kg || 0) * (transaction.outrightPrice50kg || 8500)

  // Other Company Swipes
  const swipe6kg = (transaction.swipeReturn6kg || 0) * (transaction.swipeRefillPrice6kg || 160)
  const swipe13kg = (transaction.swipeReturn13kg || 0) * (transaction.swipeRefillPrice13kg || 160)
  const swipe50kg = (transaction.swipeReturn50kg || 0) * (transaction.swipeRefillPrice50kg || 160)

  return (
    refill6kg + refill13kg + refill50kg + outright6kg + outright13kg + outright50kg + swipe6kg + swipe13kg + swipe50kg
  )
}
